package proxy

import (
	"log"
	"math/big"
	"strconv"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	ethash "github.com/yuriy0803/ethashb3"
	"github.com/yuriy0803/open-etc-pool-friends/util"
)

var (
	maxUint256 = new(big.Int).Exp(big.NewInt(2), big.NewInt(256), big.NewInt(0))
)

var hasher = ethash.New()

func (s *ProxyServer) processShare(login, id, ip string, t *BlockTemplate, params []string, stratum bool) (bool, bool) {

	nonceHex := params[0]
	hashNoNonce := params[1]
	mixDigest := params[2]
	nonce, _ := strconv.ParseUint(strings.Replace(nonceHex, "0x", "", -1), 16, 64)
	shareDiff := s.config.Proxy.Difficulty
	stratumHostname := s.config.Proxy.StratumHostname

	var result common.Hash
	if stratum {
		hashNoNonceTmp := common.HexToHash(params[2])

		_, mixDigestTmp, hashTmp := hasher.Compute(t.Height, hashNoNonceTmp, nonce)
		params[1] = hashNoNonceTmp.Hex()
		params[2] = mixDigestTmp.Hex()
		hashNoNonce = params[1]
		result = hashTmp
	} else {
		hashNoNonceTmp := common.HexToHash(hashNoNonce)
		_, mixDigestTmp, hashTmp := hasher.Compute(t.Height, hashNoNonceTmp, nonce)

		// check mixDigest
		if mixDigestTmp.Hex() != mixDigest {
			return false, false
		}
		result = hashTmp
	}

	// Block "difficulty" is BigInt
	// NiceHash "difficulty" is float64 ...
	// diffFloat => target; then: diffInt = 2^256 / target
	shareDiffCalc := util.TargetHexToDiff(result.Hex()).Int64()
	shareDiffFloat := util.DiffIntToFloat(shareDiffCalc)
	if shareDiffFloat < 0.0001 {
		log.Printf("share difficulty too low, %f < %d, from %v@%v", shareDiffFloat, t.Difficulty, login, ip)
		s.backend.WriteWorkerShareStatus(login, id, false, true, false)
		return false, false
	}

	if s.config.Proxy.Debug {
		hashrateShareDiff := formatHashrate(shareDiffCalc)
		hashrateBlockDiff := formatHashrate(t.Difficulty.Int64()) // Konvertieren zu int64
		hashrateShare := formatHashrate(shareDiff)

		// Ausgabe der formatierten Informationen in der Kommandozeile (cmd)
		log.Printf("Mining Information:")
		log.Printf("Blockchain Height: %d", t.Height) // Geändert zu "Blockchain Height"
		log.Printf("Pool Difficulty: %d (%s)", shareDiff, hashrateShare)
		log.Printf("Block Difficulty: %d (%s)", t.Difficulty.Int64(), hashrateBlockDiff)
		log.Printf("Share Difficulty: %d (%s)", shareDiffCalc, hashrateShareDiff)
		log.Printf("Submitted by: %v@%v", login, ip)
	}

	h, ok := t.headers[hashNoNonce]
	if !ok {
		log.Printf("Stale share from %v@%v", login, ip)
		return false, false
	}

	// check share difficulty
	shareTarget := new(big.Int).Div(maxUint256, big.NewInt(shareDiff))
	if result.Big().Cmp(shareTarget) > 0 {
		s.backend.WriteWorkerShareStatus(login, id, false, true, false)
		return false, false
	}

	//Write the Ip address into the settings:login:ipaddr and timeit added to settings:login:iptime hash
	s.backend.LogIP(login, ip)

	miningType := s.backend.GetMiningType(login)

	// check target difficulty
	target := new(big.Int).Div(maxUint256, big.NewInt(h.diff.Int64()))
	if result.Big().Cmp(target) <= 0 {
		ok, err := s.rpc().SubmitBlock(params)
		if err != nil {
			log.Printf("Block submission failure at height %v for %v: %v", h.height, t.Header, err)
		} else if !ok {
			log.Printf("Block rejected at height %v for %v", h.height, t.Header)
			return false, false
		} else {
			s.fetchBlockTemplate()
			if miningType == "solo" {
				exist, err := s.backend.WriteBlockSolo(login, id, params, shareDiff, shareDiffCalc, h.diff.Int64(), h.height, s.hashrateExpiration, stratumHostname)
				if exist {
					return true, false
				}
				if err != nil {
					log.Println("Failed to insert block candidate into backend:", err)
				} else {
					log.Printf("Inserted block %v to backend", h.height)
				}
			} else {
				exist, err := s.backend.WriteBlock(login, id, params, shareDiff, shareDiffCalc, h.diff.Int64(), h.height, s.hashrateExpiration, stratumHostname)
				if exist {
					return true, false
				}
				if err != nil {
					log.Println("Failed to insert block candidate into backend:", err)
				} else {
					log.Printf("Inserted block %v to backend", h.height)
				}
			}

			log.Printf("Block found by miner %v@%v at height %d", login, ip, h.height)
		}
	} else {
		if miningType == "solo" {
			exist, err := s.backend.WriteShareSolo(login, id, params, shareDiff, shareDiffCalc, h.height, s.hashrateExpiration, stratumHostname)
			if exist {
				return true, false
			}
			if err != nil {
				log.Println("Failed to insert share data into backend:", err)
			}
		} else {
			exist, err := s.backend.WriteShare(login, id, params, shareDiff, shareDiffCalc, h.height, s.hashrateExpiration, stratumHostname)
			if exist {
				return true, false
			}
			if err != nil {
				log.Println("Failed to insert share data into backend:", err)
			}
		}
	}
	s.backend.WriteWorkerShareStatus(login, id, true, false, false)
	return false, true
}
func formatHashrate(shareDiffCalc int64) string {
	units := []string{"H/s", "KH/s", "MH/s", "GH/s", "TH/s", "PH/s"}
	var i int
	diff := float64(shareDiffCalc)

	for i = 0; i < len(units)-1 && diff >= 1000.0; i++ {
		diff /= 1000.0
	}

	formatted := strconv.FormatFloat(diff, 'f', 2, 64)
	return formatted + " " + units[i]
}
