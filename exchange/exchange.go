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

// NewRestClient creates a new RestClient
func NewRestClient(name, url, timeout string) *RestClient {
	restClient := &RestClient{Name: name, Url: url}
	timeoutIntv := util.MustParseDuration(timeout)
	restClient.client = &http.Client{
		Timeout: timeoutIntv,
	}
	return restClient
}

// GetData fetches the data from the given URL and processes it
func (r *RestClient) GetData() ([]map[string]interface{}, error) {
	// If the name is "xeggex", use the xeggex-specific code
	if r.Name == "xeggex" {
		resp, err := r.doPost(r.Url, "ticker") // Use the URL specified in RestClient
		if err != nil {
			return nil, err
		}

		// Data structure for the new API response
		var data map[string]interface{}
		err = json.Unmarshal(resp, &data)
		if err != nil {
			log.Printf("Failed to parse response: %v", err)
			return nil, err
		}

		// Extract only base_currency and last_price
		result := []map[string]interface{}{
			{
				"symbol": data["base_currency"].(string), // symbol = base_currency
				"current_price":  data["last_price"].(string),   // price = last_price
			},
		}
		return result, nil
	} 

	// If the name is "coingecko", use the coingecko-specific code
	resp, err := r.doPost(r.Url, "ticker")
	if err != nil {
		return nil, err
	}

	// Data structure for the new API response
	var data ExchangeReply
	err = json.Unmarshal(resp, &data)
	if err == nil {
		return data, nil
	}

	// If decoding as a slice of maps failed, try decoding as a single map
	var dataSingle ExchangeReply1
	err = json.Unmarshal(resp, &dataSingle)
	if err == nil {
		// Convert from single map to a slice of maps with just one entry
		data = ExchangeReply{dataSingle}
		return data, nil
	}

	return nil, err
}

// StartExchangeProcessor starts the exchange processor
func StartExchangeProcessor(cfg *ExchangeConfig, backend *storage.RedisClient) *ExchangeProcessor {
	var u *ExchangeProcessor

	// If ExchangeConfig.Name is not specified, set it to "coingecko" as the default
	if cfg.Name == "" {
		cfg.Name = "coingecko"
	}

	// Check the value of ExchangeConfig.Name
	if cfg.Name == "xeggex" {
		// If it's xeggex, use the xeggex-specific code
		u = &ExchangeProcessor{ExchangeConfig: cfg, backend: backend}
		u.rpc = NewRestClient("xeggex", cfg.Url, cfg.Timeout)
	} else if cfg.Name == "coingecko" {
		// If it's coingecko, use the coingecko-specific code
		u = &ExchangeProcessor{ExchangeConfig: cfg, backend: backend}
		u.rpc = NewRestClient("coingecko", cfg.Url, cfg.Timeout)
	} else {
		log.Printf("Unsupported exchange: %s", cfg.Name)
		// Print a message if ExchangeConfig.Name is not supported
		return nil
	}

	// Check if u is nil before calling Start
	if u == nil {
		log.Printf("Failed to initialize ExchangeProcessor")
		return nil
	}
	return u
}

// Start begins the periodic fetching of data
func (u *ExchangeProcessor) Start() {
	if u == nil {
		log.Printf("ExchangeProcessor is not initialized.")
		return
	}

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

// fetchData fetches data from the exchange and stores it
func (u *ExchangeProcessor) fetchData() {
	if u == nil {
		log.Printf("ExchangeProcessor is not initialized.")
		return
	}

	reply, err := u.rpc.GetData()

	if err != nil {
		log.Printf("Failed to fetch data from exchange: %v", err)
		return
	}

	// Send the data to StoreExchangeData directly
	u.backend.StoreExchangeData(reply)

	log.Printf("Exchange data fetched and stored successfully.")
}

// doPost sends an HTTP GET request
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
