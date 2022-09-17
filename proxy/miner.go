package proxy

import (
	"log"
	"math/big"
	"strconv"
	"strings"

	"github.com/etclabscore/core-geth/common"
	"github.com/yuriy0803/etchash"
)

var (
	maxUint256                             = new(big.Int).Exp(big.NewInt(2), big.NewInt(256), big.NewInt(0))
	ecip1099FBlockClassic uint64           = 11700000 // classic mainnet
	ecip1099FBlockMordor  uint64           = 2520000  // mordor
	uip1FEpoch            uint64           = 22       // ubiq mainnet
	hasher                *etchash.Etchash = nil
)

func (s *ProxyServer) processShare(login, id, ip string, t *BlockTemplate, params []string) (bool, bool) {

	if hasher == nil {
		if s.config.Network == "classic" {
			hasher = etchash.New(&ecip1099FBlockClassic, nil)
		} else if s.config.Network == "mordor" {
			hasher = etchash.New(&ecip1099FBlockMordor, nil)
		} else if s.config.Network == "callisto" {
			hasher = etchash.New(nil, nil)
		} else if s.config.Network == "ubiq" {
			hasher = etchash.New(nil, &uip1FEpoch)
		} else if s.config.Network == "ethereum" || s.config.Network == "ropsten" {
			hasher = etchash.New(nil, nil)
		} else {
			// unknown network
			log.Printf("Unknown network configuration %s", s.config.Network)
			return false, false
		}
	}

	nonceHex := params[0]
	hashNoNonce := params[1]
	mixDigest := params[2]
	nonce, _ := strconv.ParseUint(strings.Replace(nonceHex, "0x", "", -1), 16, 64)
	shareDiff := s.config.Proxy.Difficulty

	h, ok := t.headers[hashNoNonce]
	if !ok {
		log.Printf("Stale share from %v@%v", login, ip)
		s.backend.WriteWorkerShareStatus(login, id, false, true, false)
		return false, false
	}

	share := Block{
		number:      h.height,
		hashNoNonce: common.HexToHash(hashNoNonce),
		difficulty:  big.NewInt(shareDiff),
		nonce:       nonce,
		mixDigest:   common.HexToHash(mixDigest),
	}

	block := Block{
		number:      h.height,
		hashNoNonce: common.HexToHash(hashNoNonce),
		difficulty:  h.diff,
		nonce:       nonce,
		mixDigest:   common.HexToHash(mixDigest),
	}

	//this is to stop people in wallet blacklist, from getting shares into the db.
	//rare instances of hacks require letting the hacks waste thier money on occassion
	if !s.policy.ApplyLoginWalletPolicy(login) {
		// check to see if this wallet login is blocked
		log.Printf("Blacklisted wallet share, skipped from %v", login)
		return false, false
		//return codes need work here, a lot of it.
	}

	isShare, actualDiff := hasher.Verify(share)

	if s.config.Proxy.Debug {
		log.Printf("Difficulty pool Port/Shares found/Block difficulty  = %d / %d / %d from %v@%v", shareDiff, actualDiff, t.Difficulty, login, ip)
	}

	if !isShare {
		s.backend.WriteWorkerShareStatus(login, id, false, false, true)
		return false, false
	}

	isBlock, _ := hasher.Verify(block)

	if isBlock {
		ok, err := s.rpc().SubmitBlock(params)
		if err != nil {
			log.Printf("Block submission failure at height %v for %v: %v", h.height, t.Header, err)
		} else if !ok {
			log.Printf("Block rejected at height %v for %v", h.height, t.Header)
			return false, false
		} else {
			s.fetchBlockTemplate()
			exist, err := s.backend.WriteBlock(login, id, params, shareDiff, actualDiff, h.diff.Int64(), h.height, s.hashrateExpiration)
			if exist {
				return true, false
			}
			if err != nil {
				log.Println("Failed to insert block candidate into backend:", err)
			} else {
				log.Printf("Inserted block %v to backend", h.height)
			}
			log.Printf("Block found by miner %v@%v at height %d", login, ip, h.height)
		}
	} else {
		exist, err := s.backend.WriteShare(login, id, params, shareDiff, actualDiff, h.height, s.hashrateExpiration)
		if exist {
			return true, false
		}
		if err != nil {
			log.Println("Failed to insert share data into backend:", err)
		}
	}
	s.backend.WriteWorkerShareStatus(login, id, true, false, false)
	return false, true
}
