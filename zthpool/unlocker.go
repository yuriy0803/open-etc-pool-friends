
package payer

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "log"
    "os"
    "path/filepath"
)

type NetworkConfig struct {
    Name           string            `json:"name"`
    BlockReward    map[int64]float64 `json:"blockReward"`
    AdjustmentFreq int64             `json:"adjustmentFreq"`
    HasUncles      bool              `json:"hasUncles"`
}

func LoadConfig(networkName string) (*NetworkConfig, error) {
    configPath := filepath.Join("configs", fmt.Sprintf("%s.json", networkName))
    file, err := os.Open(configPath)
    if err != nil {
        return nil, fmt.Errorf("failed to open config file for network %s: %w", networkName, err)
    }
    defer file.Close()

    var config NetworkConfig
    if err := json.NewDecoder(file).Decode(&config); err != nil {
        return nil, fmt.Errorf("failed to decode config file for network %s: %w", networkName, err)
    }
    return &config, nil
}

func GetReward(config *NetworkConfig, blockHeight int64) float64 {
    reward := 0.0
    for height, r := range config.BlockReward {
        if blockHeight >= height {
            reward = r
        } else {
            break
        }
    }
    return reward
}

func SimulateUnlock(networkName string, blockHeight int64) {
    config, err := LoadConfig(networkName)
    if err != nil {
        log.Fatalf("Error loading network configuration: %v", err)
    }

    reward := GetReward(config, blockHeight)
    fmt.Printf("Network: %s\n", config.Name)
    fmt.Printf("Block Height: %d\n", blockHeight)
    fmt.Printf("Block Reward: %.2f\n", reward)

    if !config.HasUncles {
        fmt.Println("Note: This network does not include uncle blocks.")
    }
}

func main() {
    fmt.Println("---- Zether (ZTH) ----")
    SimulateUnlock("zth", 50000)

    fmt.Println("---- Zether Testnet (ZTH-Test) ----")
    SimulateUnlock("zth-test", 1500)
}
