<script>
    import NDK, { NDKEvent, NDKNip07Signer } from "@nostr-dev-kit/ndk";
    import {browser} from '$app/environment';
    import { onMount } from 'svelte';
    import { nip19 } from "nostr-tools";
    import { writable } from 'svelte/store';
    import { stringify } from 'flatted';

    const ndk = new NDK({
        explicitRelayUrls: [ "wss://nostr.fmt.wiz.biz", "wss://nostr.mom", "wss://relay.primal.net", "wss://nos.lol", "wss://nostr.thank.eu", "wss://nostr.wine", "wss://deschooling.us", "wss://relay.nostr.band", "wss://relay.damus.io", "wss://purplepag.es", "wss://history.nostr.watch", "wss://lunchbox.sandwich.farm", "wss://fiatjaf.com", "wss://nostr.mom", "wss://nostr.8777.ch"],
    });

    let isLoading = true;
    let events = []; 
    let user = null;
    let isUserLoggedIn = false;
    let eventszFromSubscription = [];
    let filteredName = [];
    let filteredPicture = [];
    let filteredAbout = [];
    let filteredWeb = [];
    let filteredNpub = [];
    let filteredNip19 = [];
    const eventszStore = writable([]);

    eventszStore.subscribe(value => {
    });

    if (browser) {
        ndk.connect().then(() => {
            console.log('Connected');
            requestAnimationFrame(fetchEventFromSub);
        });
    }
    
    const eventsPromise = ndk.fetchEvents({kinds:[1]});
    const profilesPromise = ndk.fetchEvents({kinds:[0]});

    eventsPromise.then(fetchedEvents => {
        events = fetchedEvents;
        isLoading = false;
    }).catch(error => {
        isLoading = false;
    });

    profilesPromise.then(fetchedEvents => {
        events = fetchedEvents;
        isLoading = false;
    }).catch(error => {
        isLoading = false;
    });

    function convertTimestamp(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    }

    let hoveredNote = null;

    function handleHover(event) {
        hoveredNote = event.currentTarget;
        const audio = new Audio('/drag.mp3');
        audio.volume = 0.03;
        audio.play();
    }

    function handleHoverz(event) {
        hoveredNote = event.currentTarget;
        const audio = new Audio('/buzz.mp3');
        audio.volume = 0.03;
        audio.play();
    }

    function handleMouseLeave() {
        hoveredNote = null;
        const audio = new Audio('/scrape.mp3');
        audio.play();
    }

    function handleFocus(event) {
        hoveredNote = event.currentTarget;
    }

    function handleDestroy(event) {
        const note = event.currentTarget.parentNode;
        note.classList.add('noterun');
        const audio = new Audio('/boom.mp3');
        audio.play();
        audio.volume = 0.06;
        setTimeout(() => {
            const grandparentNode = note.parentNode.parentNode;
            grandparentNode.classList.add('leftrun');
            setTimeout(() => {
                grandparentNode.remove();
            }, 1000);
        }, 500);
    }

    onMount(() => {
        document.querySelectorAll('.note .numbering').forEach(item => {
            item.addEventListener('click', handleDestroy);
        });
    });

    const now = Math.floor(Date.now() / 3000);
    const lastWeek = now - (7 * 24 * 60 * 60);

    function fetchEventFromSub() {
        const sub = ndk.subscribe({ kinds: [1], created_at: { $gte: lastWeek }, }, { closeOnEose: false });
        let matchedEvents = [];
        let combinedEvents = {};

        sub.on('event', (receivedEvent) => {
            const content = receivedEvent.content;
            const wordCount = content.split(/\s+/).length;
            const excludedWords = ["nostr", "relay", "client", "nip", "bitcoin", "btc", "kyc", "tech", "utxo", "mempool", "lightning", "ln", "zapped", "sats"];
            const pattern = excludedWords.join("|");
            const regex = new RegExp(pattern, "i");

            if (receivedEvent.tags.some(tag => tag[0] === "e") || wordCount < 50 || regex.test(content)) {
                return;
            }

            matchedEvents.push(receivedEvent);
            const hexpubkey = receivedEvent.pubkey;

            if (!combinedEvents[hexpubkey]) {
                const capturedEvent = receivedEvent;

                combinedEvents[hexpubkey] = { kind1: capturedEvent, kind0: null };

                const subz = ndk.subscribe({ kinds: [0], authors: [hexpubkey] }, { closeOnEose: false });

                subz.on('event', (receivedKind0Event) => {
                    try {
                        const parsedContent = JSON.parse(receivedKind0Event.content);
                        combinedEvents[hexpubkey].kind0 = parsedContent;
                    } catch (error) {
                        console.error("Error parsing content:", error);
                    }
                });

                subz.on('eose', () => {
                    console.log('End of stream for subz');
                    distributeCombinedEvents(combinedEvents[hexpubkey]);
                });

                subz.on('notice', (notice) => {
                    console.log('Notice for subz:', notice);
                });
            }
        });

        sub.on('eose', () => {
            console.log('End of stream for sub');
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

                filteredName.push(combinedEvent.kind0.name);
                filteredPicture.push(combinedEvent.kind0.picture || 'https://www.nicepng.com/png/detail/101-1019050_no-picture-taking-sign.png');
                filteredAbout.push(combinedEvent.kind0.about);
                filteredWeb.push(combinedEvent.kind0.website);
                filteredNpub.push(combinedEvent.kind0.npub);
                filteredNip19.push(combinedEvent.kind0.nip19);

                eventszStore.set([...eventszFromSubscription]);
            }
        }
    }


    eventszStore.subscribe(value => {
        eventszFromSubscription = value;
    });


    async function login() {
        const signer = new NDKNip07Signer;
        ndk.signer = signer;
        try {
            user = await signer.user();
            user.ndk = ndk;
            await user.fetchProfile();
            isUserLoggedIn = true;
        } catch (error) {
            console.error("Error occurred during login:", error);
        }
    }

    function parseContent(content) {
        if (content) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        content = content.replace(urlRegex, url => `<a href="${url}" target="blank">${url}</a>`);
        content = content.replace(/(https?:\/\/[^\s"'<>]+?\.(?:png|jpg|jpeg|gif|bmp))/gi, '<img src="$1" style="max-width: 100%; height: auto;" />');
        content = content.replace(/(https?:\/\/.*?\.(?:mp4|webm))/gi, '<video controls style="max-width: 100%; height: auto;"><source src="$1" type="video/mp4" ></video>');
        return content;
    } else {
            return 'I have not written a profile. Ergo, the more time you spend reading right here, the less time you are doing something productive. Go get a hobby and stop reading filler info on a random nostr client. The person who is associated with this npub did not write this. Do you understand what I am saying? You are truly wasting your time.';
        }
    }

    async function zapAction(kind1Event) {
        if (!user) return;

        const amount = 2000;
        const comment = prompt("You are about to cast a 2000 sat thunderbolt on this note. Speak your mind if you like!") || "";

        try {
            const serializedEvent = stringify(kind1Event);

            console.log(serializedEvent);
            const paymentRequest = await kind1Event.zap(amount, comment, serializedEvent);
        } catch (error) {
            console.error("Error zapping funds:", error);
        }
    }

</script>

<div class="content">
    <div class="left">
        {#if isLoading}
            <p class="loading">If you can read this, I'm loadin' up some notes right now, so you can go right ahead and hold your horses for just a minute. HOLD YOUR HORSES!</p>
            {:else}
            {#if isUserLoggedIn}
                {#await user.fetchProfile() then events}
                    <div class="note" on:mouseenter={handleHover} on:mouseleave={handleMouseLeave} on:focus={handleFocus} role="button" tabindex="0">
                        <p class="numbering" on:mouseover={handleHoverz} on:click={handleDestroy} on:focus={handleFocus} >yuck!</p>
                        <p class="date">Congrats! You have successfully logged into nostrminusnostr. You can now see your own beautiful profile picture and zap some notes. Zaps on nostrminusnostr are always for 2000 sats. Why, you ask? I want you to only zap content that you really like, and I want it to actually make an impact for the writer. Given the size of the zaps, let's call them thunderbolts. I know that's not a real thing. Lightning has the bolts and thunder's just the noise, but hey, it sounds cooler.</p>
                        <p class="text">While here, you can enjoy this list of random longer notes. Yes, here you only ever get a global feed, which is not filtered by npubs you follow. So what's in it for you? This global feed is only of larger notes, and NONE of them are about nostr or even Bitcoin.</p>
                        <p class="date">That's right! What nostr really needs is less nostr talk. It's too recursive. So...I've censored that out for you. Welcome to a highly censored client on the world's most censorship-resistant protocol. Face it, you're aunt Lisa will never enjoy spending time on nostr reading about nostr. But she might enjoy reading stuff here.</p>
                        <p class="text">If you don't like all my rules, no worries. Find another client. Best of luck finding these 90s pizza party colors somewhere else though!</p>
                    </div>
                {/await}
            {/if}
        {/if}
    </div>
    <div class="right">
        <button class="login" on:click={login}>Login</button>
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
                        <p class="text">{@html parseContent(combinedEvent.kind1.content)}</p>
                        <p class="date">{convertTimestamp(combinedEvent.kind1.created_at)}</p>
                        <button class="zap" on:click={() => zapAction(combinedEvent.kind1)}>THUNDER!</button>
                    </div>
                {/if}
            </div>

            <div class="right">
                {#if isLoading}
                    <p class="loading">Horses: hold 'em.</p>
                {:else}
                    <h2>{combinedEvent.kind0.name}</h2>
                    <p>
                        <img src={combinedEvent.kind0.picture || 'https://www.nicepng.com/png/detail/101-1019050_no-picture-taking-sign.png'} class="click-me" alt="NOPICTURE" on:click={() => zapAction(combinedEvent.kind1)} />
                    </p>
                    <p class="about">{@html parseContent(combinedEvent.kind0.about)}</p>
                    <a class="peep" href={combinedEvent.kind0.website} target="blank">{combinedEvent.kind0.name}'s Website</a>
                    <p class="about">{nip19.npubEncode(combinedEvent.kind1.pubkey)}</p>
                {/if}
            </div>
        {/if}
    </div>
{/each}