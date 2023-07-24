package exchange

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/yuriy0803/open-etc-pool-friends/storage"
	"github.com/yuriy0803/open-etc-pool-friends/util"
)

type ExchangeProcessor struct {
	ExchangeConfig *ExchangeConfig
	backend        *storage.RedisClient
	rpc            *RestClient
	halt           bool
}

type ExchangeConfig struct {
	Enabled         bool   `json:"enabled"`
	Name            string `json:"name"`
	Url             string `json:"url"`
	Timeout         string `json:"timeout"`
	RefreshInterval string `json:"refreshInterval"`
}

type RestClient struct {
	sync.RWMutex
	Url         string
	Name        string
	sick        bool
	sickRate    int
	successRate int
	client      *http.Client
}

type ExchangeReply1 map[string]interface{}

type ExchangeReply []map[string]interface{}

func NewRestClient(name, url, timeout string) *RestClient {
	restClient := &RestClient{Name: name, Url: url}
	timeoutIntv := util.MustParseDuration(timeout)
	restClient.client = &http.Client{
		Timeout: timeoutIntv,
	}
	return restClient
}

func (r *RestClient) GetData() (ExchangeReply, error) {
	resp, err := r.doPost(r.Url, "ticker")
	if err != nil {
		return nil, err
	}

	// Attempt to interpret the response as a slice of maps
	var data ExchangeReply
	err = json.Unmarshal(resp, &data)
	if err == nil {
		return data, nil
	}

	// If interpreting as a slice of maps fails, try to interpret it as a single map
	var dataSingle ExchangeReply1
	err = json.Unmarshal(resp, &dataSingle)
	if err == nil {
		// Convert the single map into a slice of maps with only one entry
		data = ExchangeReply{dataSingle}
		return data, nil
	}

	return nil, err
}

func StartExchangeProcessor(cfg *ExchangeConfig, backend *storage.RedisClient) *ExchangeProcessor {
	u := &ExchangeProcessor{ExchangeConfig: cfg, backend: backend}
	u.rpc = NewRestClient("ExchangeProcessor", cfg.Url, cfg.Timeout)
	return u
}

func (u *ExchangeProcessor) Start() {
	refreshIntv := util.MustParseDuration(u.ExchangeConfig.RefreshInterval)
	refreshTimer := time.NewTimer(refreshIntv)
	log.Printf("Set Exchange data refresh every %v", refreshIntv)

	u.fetchData()
	refreshTimer.Reset(refreshIntv)

	go func() {
		for {
			select {
			case <-refreshTimer.C:
				u.fetchData()
				refreshTimer.Reset(refreshIntv)
			}
		}
	}()
}

func (u *ExchangeProcessor) fetchData() {
	reply, err := u.rpc.GetData()

	if err != nil {
		log.Printf("Failed to fetch data from exchange %v", err)
		return
	}

	u.backend.StoreExchangeData(reply)

	if err != nil {
		log.Printf("Failed to store the data to exchange %v", err)
		return
	}

	return
}

func (r *RestClient) doPost(url string, method string) ([]byte, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := r.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 { // OK
		bodyBytes, err2 := ioutil.ReadAll(resp.Body)
		return bodyBytes, err2
	}

	return nil, err
}
