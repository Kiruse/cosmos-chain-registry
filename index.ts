const BASE_API_URL = 'https://api.github.com/repos/cosmos/chain-registry/contents'
const BASE_CNT_URL = 'https://raw.githubusercontent.com/cosmos/chain-registry/master'

/** Gets & caches a list of chains by their unique registry names. */
var chains: Set<string> | undefined;
export async function getChains() {
  if (!chains) {
    const res = await fetch(BASE_API_URL, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    const contents = await res.json();
    chains = new Set(
      contents
      .filter((entry: any) => entry.size === 0) // filter for directories
      .filter((entry: any) => !entry.name.startsWith('.') && !entry.name.startsWith('_') && entry.name !== 'testnets')
      .map((entry: any) => entry.name)
    );
  }
  return chains!;
}

/** Get chain info by registry name */
var info: Record<string, ChainInfo> = {};
export async function getChainInfo(chain: string) {
  if (!info[chain]) {
    const res = await fetch(`${BASE_CNT_URL}/${chain}/chain.json`);
    info[chain] = await res.json();
    info[chain]['$schema'] = `${BASE_CNT_URL}/chain.schema.json`;
  }
  return info[chain]!;
}

var assets: Record<string, ChainAssetList> = {};
export async function getChainAssets(chain: string) {
  if (!assets[chain]) {
    const res = await fetch(`${BASE_CNT_URL}/${chain}/assetlist.json`);
    assets[chain] = await res.json();
    assets[chain]['$schema'] = `${BASE_CNT_URL}/assetlist.schema.json`;
  }
  return assets[chain]!;
}

export async function getChainAsset(chain: string, asset: string) {
  const list = await getChainAssets(chain);
  const firstTry = list.assets.find((a) => a.name === asset);
  if (firstTry) return firstTry;
  const secondTry = list.assets.find((a) => a.symbol === asset);
  if (secondTry) return secondTry;
  const thirdTry = list.assets.find((a) => a.name.toLowerCase() === asset.toLowerCase());
  if (thirdTry) return thirdTry;
  throw new Error(`Asset ${asset} not found on chain ${chain}`);
}

export interface ChainInfo {
  $schema: string;
  chain_name: string;
  status: string;
  /** Type of this network. Typically mainnet or testnet, but not strictly required. */
  network_type: string;
  website: string;
  pretty_name: string;
  chain_id: string;
  /** Name of the full node or CLI executable */
  daemon_name: string;
  /** Default path to the full node's data */
  node_home: string;
  /** The bech32 prefix used for addresses */
  bech32_prefix: string;
  /** The SLIP44 coin type - see https://github.com/satoshilabs/slips/blob/master/slip-0044.md */
  slip44: number;
  fees: {
    fee_tokens: {
      denom: string;
      fixed_min_gas_price: number;
      low_gas_price: number;
      average_gas_price: number;
      high_gas_price: number;
    }[];
  };
  staking: {
    staking_tokens: unknown[];
  };
  codebase: unknown;
  logo_URIs: {
    [type: string]: string;
  };
  description: string;
  peers: {
    seeds: {
      id: string;
      address: string;
      provider?: string;
    }[];
    persistent_peers: {
      id: string;
      address: string;
      provider?: string;
    }[];
  };
  apis: {
    [type: string]: {
      address: string;
      provider: string;
    };
  };
  explorers: {
    kind: string;
    url: string;
    tx_page?: string;
    account_page?: string;
  }[];
  images: {
    [type: string]: string;
  }[];
}

export interface ChainAssetList {
  $schema: string;
  chain_name: string;
  assets: ChainAsset[];
}

export interface ChainAsset {
  description: string;
  /** The type of asset. Typically something like 'cw20' or 'ics20'. When omitted, it's assumed to be a native coin. */
  type_asset?: string;
  denom_units: {
    denom: string;
    exponent: number;
    aliases?: string[];
  }[];
  /** The item of `denom_units` which should be used as the base denomination of this asset */
  base: string;
  /** The display name of this asset */
  name: string;
  /** The item of `denom_units` which should be used to display token amounts in a UI */
  display: string;
  /** The denomination symbol to display in a UI */
  symbol: string;
  logo_URIs: {
    [type: string]: string;
  };
  coingecko_id?: string;
  images?: (
    {
      [type: Exclude<string, 'image_sync'>]: string;
    } & {
      image_sync: {
        chain_name: string;
        base_denom: string;
      };
    }
  )[];
  /** URLs for the various official social channels of this asset */
  socials?: {
    [type: string]: string;
  };
  /** For an ICS20 token, these traces describe the path through which the token arrives on this chain. */
  traces?: {
    type: string;
    /** IBC info on the remote side of the connection. */
    counterparty: {
      /** Registry name of the remote chain */
      chain_name: string;
      /** Base denom as found on the remote chain. Typically also registered in the Cosmos Chain Registry. */
      base_denom: string;
      /** Channel ID of this connection on the remote chain. Only assets sent through this channel are considered canonical. */
      channel_id: string;
    };
    /** IBC info on this side of the connection. */
    chain: {
      /** Channel ID of this connection on this chain. The asset must be sent back through this channel to properly unwrap. */
      channel_id: string;
      /** IBC denom path. This is used to compute the base denom name of the format `ibc/${hash(path)}`. */
      path: string;
    };
  }[];
}
