<script>
    import NDK, { NDKEvent, NDKNip07Signer } from "@nostr-dev-kit/ndk";
    import {browser} from '$app/environment';
    import { onMount } from 'svelte';
    import { nip19 } from "nostr-tools";
    import { writable } from 'svelte/store';

    const ndk = new NDK({
        explicitRelayUrls: ["wss://nos.lol", "wss://nostr.thank.eu", "wss://relay.primal.net", "wss://nostr.wine", "wss://deschooling.us", "wss://relay.nostr.band", "wss://relay.damus.io", "wss://purplepag.es", "wss://nostr.land", "wss://history.nostr.watch", "wss://lunchbox.sandwich.farm", "wss://fiatjaf.com", "wss://nostr.mom", "wss://nostr.8777.ch"],
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
        const grandparentNode = note.parentNode.parentNode;
        grandparentNode.classList.add('leftrun');
        setTimeout(() => {
            grandparentNode.remove();
        }, 1000);
    }, 900);
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
        eventszFromSubscription = [];
        const sub = ndk.subscribe({ kinds: [1], created_at_gte: lastWeek }, { closeOnEose: false });
        let matchedEvents = [];
        let combinedEvents = {};

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

            const hexpubkey = receivedEvent.pubkey;

            if (!combinedEvents[hexpubkey]) {
                combinedEvents[hexpubkey] = { kind1: receivedEvent, kind0: null }; // Initialize with kind 1 event

                // Subscribe to kind 0 events for the same pubkey
                const subz = ndk.subscribe({ kinds: [0], authors: [hexpubkey] }, { closeOnEose: false });

                subz.on('event', (receivedKind0Event) => {
                    try {
                        const parsedContent = JSON.parse(receivedKind0Event.content);
                        combinedEvents[hexpubkey].kind0 = parsedContent; // Update with kind 0 event
                    } catch (error) {
                        console.error("Error parsing content:", error);
                    }
                });

                subz.on('eose', () => {
                    console.log('End of stream for subz');
                    // Once end of stream is reached, distribute the combined event data
                    distributeCombinedEvents(combinedEvents[hexpubkey]);
                });

                subz.on('notice', (notice) => {
                    console.log('Notice for subz:', notice);
                });
            }
        });

        sub.on('eose', () => {
            console.log('End of stream for sub');
            // Distribute combined event data for all matched events
            matchedEvents.forEach(event => {
                distributeCombinedEvents(combinedEvents[event.pubkey]);
            });
        });
    }

const uniqueEventIds = new Set();

function distributeCombinedEvents(combinedEvent) {
    if (combinedEvent.kind1 && combinedEvent.kind0) {
        const eventId = combinedEvent.kind1.id;
        if (!uniqueEventIds.has(eventId)) {
            uniqueEventIds.add(eventId);
            eventszFromSubscription.push(combinedEvent);

            // Check if the kind 0 event npub is already present in filteredNpub
            const npubIndex = filteredNpub.indexOf(combinedEvent.kind0.npub);

            if (npubIndex === -1) {
                // If npub is not present, add combined event data to arrays
                eventszFromSubscription.push(combinedEvent);
                eventszStore.update(events => [...events, combinedEvent]);

                filteredName.push(combinedEvent.kind0.name);
                filteredPicture.push(combinedEvent.kind0.picture);
                filteredAbout.push(combinedEvent.kind0.about);
                filteredWeb.push(combinedEvent.kind0.website);
                filteredNpub.push(combinedEvent.kind0.npub);
            } else {
                // If npub is already present, update the corresponding entry with the new data
                eventszFromSubscription.splice(npubIndex, 1, combinedEvent);
                eventszStore.update(events => {
                    const updatedEvents = [...events];
                    updatedEvents.splice(npubIndex, 1, combinedEvent);
                    return updatedEvents;
                });

                filteredName.splice(npubIndex, 1, combinedEvent.kind0.name);
                filteredPicture.splice(npubIndex, 1, combinedEvent.kind0.picture);
                filteredAbout.splice(npubIndex, 1, combinedEvent.kind0.about);
                filteredWeb.splice(npubIndex, 1, combinedEvent.kind0.website);
                filteredNpub.splice(npubIndex, 1, combinedEvent.kind0.npub);
            }
        }
    }
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
        if (content) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
    } else {
            return ''; // Or any default value you want to return when content is undefined or null
        }
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
                </div>
            {/each}
        {/if}
    </div>
    <div class="right">
        <button on:click={login}>Login</button>
        {#if isLoading}
            <p class="loading">Horses: hold 'em.</p>
            {:else}
            {#if isUserLoggedIn}
                {#await user.fetchProfile() then events}
                    <div class="right">
                        <h2>{user.profile?.name}</h2>
                        <p>
                            <img src={user.profile?.image} class="click-me" alt="NOPICTURE" />
                        </p>
                        <p>{user.profile?.about}</p>
                        <p>{user.profile?.lud16}</p>
                    </div>
                {/await}
            {/if}
        {/if}
    </div>
</div>

{#each eventszFromSubscription as combinedEvent}
    <div class="content">
        {#if combinedEvent.kind1 && combinedEvent.kind0}
            <div class="left">
                {#if isLoading}
                    <p class="loading">If you can read this, I'm loadin' up some notes right now, so you can go right ahead and hold your horses for just a minute. HOLD YOUR HORSES!</p>
                {:else}
                    <div class="note" on:mouseenter={handleHover} on:mouseleave={handleMouseLeave} on:focus={handleFocus} role="button" tabindex="0">
                        <p class="numbering" on:mouseover={handleHoverz} on:click={handleDestroy} on:focus={handleFocus} >yuck!</p>
                        <p class="text">{@html parseContent(combinedEvent.kind1.content)}</p> <!-- Access kind 1 event data -->
                        <p class="date">{convertTimestamp(combinedEvent.kind1.created_at)}</p>
                    </div>
                {/if}
            </div>

            <div class="right">
                {#if isLoading}
                    <p class="loading">Horses: hold 'em.</p>
                {:else}
                    <h2>{combinedEvent.kind0.name}</h2> <!-- Access kind 0 event data -->
                    <p>
                        <img src={combinedEvent.kind0.picture} class="click-me" alt="NOPICTURE" />
                    </p>
                    <p class="about">{@html parseContent(combinedEvent.kind0.about)}</p>
                    <a class="peep" href={combinedEvent.kind0.website} target="blank">{combinedEvent.kind0.name}'s Website</a>
                    <p class="about">{nip19.npubEncode(combinedEvent.kind1.pubkey)}</p>
                {/if}
            </div>
        {/if}
    </div>
{/each}