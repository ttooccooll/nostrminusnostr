import NDK from "@nostr-dev-kit/ndk";

const sharedRelays = [
    "wss://nostr.mom", "wss://relay.primal.net", "wss://nos.lol",
    "wss://nostr.thank.eu", "wss://nostr.wine", "wss://relay.damus.io",
    "wss://purplepag.es", "wss://lunchbox.sandwich.farm", "wss://fiatjaf.com",
    "wss://nostr.8777.ch", "wss://relay.snort.social", "wss://eden.nostr.land",
    "wss://offchain.pub", "wss://nostr.bitcoiner.social", "wss://yabu.me",
    "wss://relay.nostr.sc", "wss://nostr.land", "wss://relay.nostr.info",
    "wss://nostr.oxtr.dev", "wss://relay.0xchat.com",
    "wss://nostr-01.yakihonne.com", "wss://nostr.superfriends.online",
    "wss://relay.nos.social", "wss://relay.getalby.com", "wss://relay.nostr.net"
];

const ndk = new NDK({ explicitRelayUrls: sharedRelays });

export default ndk;
