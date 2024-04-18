<script>
    import NDK, { NDKNip07Signer } from "@nostr-dev-kit/ndk";
    import {browser} from '$app/environment';

    const ndk = new NDK({
        explicitRelayUrls: ["wss://relay.nostr.band", "wss://relay.damus.io", "wss://purplepag.es", "wss://relay.primal.net", "wss://nostr.land"],
    });

    if (browser) {
        ndk.connect().then(() => {
            console.log('Connected');
        });
    }

    async function login() {
        const signer = new NDKNip07Signer;
        ndk.signer = signer;
        signer.user().then((user) => {
            console.log(user);
        });
    }
</script>

<button on:click={login}>Log in</button>