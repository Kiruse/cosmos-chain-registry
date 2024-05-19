# Cosmos Chain Registry
This is a simple library to retrieve current contents of the [Cosmos Chain Registry repository](https://github.com/cosmos/chain-registry.git). Unlike other libraries, it does not ship with any concrete version of the repository, but instead requests them from GitHub directly using the built-in JavaScript `fetch` method.

## Installation
It does not have any additional dependencies. Add with your favorite package managers:
```bash
$ npm i @kiruse/cosmos-chain-registry
$ yarn add @kiruse/cosmos-chain-registry
$ bun add @kiruse/cosmos-chain-registry
```

## Usage
The library exposes a few async methods:

```javascript
import { getChains, getChainInfo, getChainAssets, getChainAsset } from '@kiruse/cosmos-chain-registry';

// gets a list of all chain names. this list is compiled from the directories in the repository's root.
// directories starting with . or _ are omitted. likewise, the `testnets` directory is omitted.
await getChains(); // returns: string[]

// gets the contents of the `terra2/chain.json` metadata file. the `ChainInfo` type contains a lot of
// details, but not all.
await getChainInfo('terra2'); // returns: ChainInfo

// gets the contents of the `terra2/assetlist.json` metadata file. the `ChainAssetList` type contains
// a lot of details, but may be incomplete.
await getChainAssets('terra2'); // returns: ChainAssetList

// tries to find an asset from `getChainAssets('terra2')` where any of these conditions is true, in this order:
// 1) name matches directly
// 2) symbol matches directly
// 3) name lowercased matches term lowercased
await getChainAsset('terra2', 'luna'); // returns: ChainAsset
```

Note that there is currently no quick way to get chain info by chain ID. The only way is to iterate through all chains by name in order to find the one with the matching chain ID. As chain info is stored in individual files, this requires a lot of requests, and will either be slow, or may get rate-limited.
