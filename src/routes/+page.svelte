<script>
    import NDK, { NDKEvent, NDKNip07Signer } from "@nostr-dev-kit/ndk";
    import {browser} from '$app/environment';
    import { onMount } from 'svelte';
    import { nip19 } from "nostr-tools";
    import { writable } from 'svelte/store';

    const ndk = new NDK({
        explicitRelayUrls: ["wss://relay.primal.net", "wss://nostr.wine", "wss://deschooling.us", "wss://relay.nostr.band", "wss://relay.damus.io", "wss://purplepag.es", "wss://nostr.land", "wss://history.nostr.watch", "wss://lunchbox.sandwich.farm", "wss://fiatjaf.com", "wss://nostr.mom"],
    });

    let isLoading = true;
    let events = []; 
    let user = null;
    let isUserLoggedIn = false;
    let event = NDKEvent | null;
    let eventsFromSubscription = [];
    let eventszFromSubscription = [];
    let filteredName = [];
    let filteredPicture = [];
    let filteredAbout = [];
    let filteredWeb = [];
    let filteredNpub = [];
    const eventszStore = writable([]);

    eventszStore.subscribe(value => {
});

    if (browser) {
        ndk.connect().then(() => {
            console.log('Connected');
            setInterval(fetchEventFromSub(), 3000);
        });
    }
    
    // const user = ndk.getUser({npub: 'npub1a95w2zch0gqfa0vhlgygz0xklwxccw6st88qkmhsk8d3tke2sqaqamsnzq'});
    const eventsPromise = ndk.fetchEvents({kinds:[1], limit:1000});
    const profilesPromise = ndk.fetchEvents({kinds:[0], limit:100});

    eventsPromise.then(fetchedEvents => {
        events = fetchedEvents;
        isLoading = false;
    }).catch(error => {
        console.error('Error fetching events:', error);
        isLoading = false;
    });

    profilesPromise.then(fetchedEvents => {
        events = fetchedEvents;
        isLoading = false;
    }).catch(error => {
        console.error('Error fetching events:', error);
        isLoading = false;
    });

    function convertTimestamp(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    }

    let hoveredNote = null;

    function handleHover(event) {
        hoveredNote = event.currentTarget;
        try {
            const audio = new Audio('/drag.mp3');
            audio.volume = 0.05;
            audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    function handleHoverz(event) {
        hoveredNote = event.currentTarget;
        try {
            const audio = new Audio('/buzz.mp3');
            audio.volume = 0.05;
            audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    function handleMouseLeave() {
        hoveredNote = null;
        try {
            const audio = new Audio('/scrape.mp3');
            audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    function handleFocus(event) {
        hoveredNote = event.currentTarget;
    }

    function handleDestroy(event) {
        const note = event.currentTarget.parentNode;
        note.classList.add('noterun');
        const audio = new Audio('/boom.mp3');
        audio.play();
        audio.volume = 0.1;
        setTimeout(() => {
            note.remove();
        }, 1000);
    }

    onMount(() => {
        document.querySelectorAll('.note .numbering').forEach(item => {
            item.addEventListener('click', handleDestroy);
        });
    });

    function fetchProfile() {
        const pr = '';
        ndk.fetchProfile(pr).then((profile) => {
            console.log(profile);
            event = profile;
        });
    };

    const now = Math.floor(Date.now() / 1000);
    const lastWeek = now - (7 * 24 * 60 * 60);

    function fetchEventFromSub() {
        const sub = ndk.subscribe({ kinds: [1], limit: 1000, created_at_gte: lastWeek }, { closeOnEose: false });
        let matchedEvents = [];
        let latestKind0Events = {};

        sub.on('event', (receivedEvent) => {
            const content = receivedEvent.content;
            const wordCount = content.split(/\s+/).length;
            const excludedWords = ["nostr", "relay", "client", "nip", "bitcoin", "btc", "kyc", "tech", "utxo", "mempool", "lightning", "ln", "zapped"];
            const pattern = excludedWords.join("|");
            const regex = new RegExp(pattern, "i");
        
        if (wordCount < 100 || regex.test(content)) {
            return;
        }

        matchedEvents.push(receivedEvent);
        eventsFromSubscription = [...eventsFromSubscription, receivedEvent];

        const hexpubkey = receivedEvent.pubkey;

        if (!latestKind0Events[hexpubkey]) {
            const subz = ndk.subscribe({ kinds: [0], authors: [hexpubkey] }, { closeOnEose: false });

            subz.on('event', (receivedKind0Event) => {
                try {
                    const parsedContent = JSON.parse(receivedKind0Event.content);
                    console.log("Parsed content:", parsedContent);
                    if (!latestKind0Events[hexpubkey] || receivedKind0Event.created_at > latestKind0Events[hexpubkey].created_at) {
                        latestKind0Events[hexpubkey] = parsedContent;
                    }
                    eventszFromSubscription.push(parsedContent);
                    eventszStore.update(events => [...events, parsedContent]);
                    filteredName.push(parsedContent.name);
                    filteredPicture.push(parsedContent.picture);
                    filteredAbout.push(parsedContent.about);
                    filteredWeb.push(parsedContent.website);
                    filteredNpub.push(parsedContent.npub);
                    latestKind0Events[hexpubkey] = parsedContent;
                } catch (error) {
                    console.error("Error parsing content:", error);
                }
            });

            subz.on('eose', () => {
                console.log('End of stream for subz');
            });

            subz.on('notice', (notice) => {
                console.log('Notice for subz:', notice);
            });
        }
    });

    sub.on('eose', () => {
        console.log('End of stream for sub');
        const matchedHexpubkeys = matchedEvents.map(event => event.pubkey);
        matchedHexpubkeys.forEach(hexpubkey => {
            if (latestKind0Events[hexpubkey]) {
                eventszFromSubscription.push(latestKind0Events[hexpubkey]);
                eventszStore.update(events => [...events, latestKind0Events[hexpubkey]]);
            }
        });
    });
}

eventszStore.subscribe(value => {
    // Update eventszFromSubscription with the latest value
    eventszFromSubscription = value;
});

    function fetchEventFromId() {
        const noteId = 'a7b6c336c0ae37094388531125ede9dc9d4141e4ac4a5f0d15ee78e41e07e040';
        // const decoded = nip19.decode(noteId);
        ndk.fetchEvent({ids:[noteId], kinds:[1]}).then((fetchedEvent) => {
            event = fetchedEvent;
            console.log(event);
        });
    };

    async function login() {
        const signer = new NDKNip07Signer;
        ndk.signer = signer;
        try {
            user = await signer.user();
            user.ndk = ndk;
            await user.fetchProfile();
            isUserLoggedIn = true;
            console.log(user);
        } catch (error) {
            console.error("Error occurred during login:", error);
        }
    }

    function parseContent(content) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
    }

</script>


<div class="content">
    
    <div class="left">
        {#if isLoading}
            <p class="loading">If you can read this, I'm loadin' up some notes right now, so you can go right ahead and hold your horses for just a minute. HOLD YOUR HORSES!</p>
        {:else}
            {#each eventsFromSubscription as event}
                <div class="note" on:mouseenter={handleHover} on:mouseleave={handleMouseLeave} on:focus={handleFocus} role="button" tabindex="0">
                    <p class="numbering" on:mouseover={handleHoverz} on:click={handleDestroy} on:focus={handleFocus} >yuck!</p>
                    <p class="text">{@html parseContent(event.content)}</p>
                    <p class="date">{convertTimestamp(event.created_at)}</p>
                    <p class="peep">{nip19.npubEncode(event.pubkey)}</p>
                </div>
            {/each}
        {/if}
    </div>

    <div class="right">
        <button on:click={login}>Login</button>
        {#if isLoading}
            <p class="loading">Horses: hold 'em.</p>
        {:else}
            {#each eventszFromSubscription as event}
                    <h2>{event.name}</h2>
                    <p>
                        <img src={event.picture} class="click-me" alt="NOPICTURE" />
                    </p>
                    <p class="about">{@html parseContent(event.about)}</p>
                    <a class="peep" href="{event.website}" target="blank">{event.name}'s Website</a>
                    <p class="about">{event.npub}</p>
            {/each}
        {/if}
    </div>

</div>

<div class="right">
    {#if isLoading}
        <p class="loading">Horses: hold 'em.</p>
    {:else}
        {#if isUserLoggedIn}
            {#await user.fetchProfile() then events}
                <h2>{user.profile?.name}</h2>
                <p>
                    <img src={user.profile?.image} class="click-me" alt="NOPICTURE" />
                </p>
                <p>{user.profile?.about}</p>
                <p>{user.profile?.lud16}</p>
            {/await}
        {/if}
    {/if}
</div>