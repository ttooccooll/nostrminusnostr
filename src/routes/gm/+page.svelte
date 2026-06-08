<script>
    import NDK, { NDKEvent, NDKNip07Signer } from "@nostr-dev-kit/ndk";
    import {browser} from '$app/environment';
    import { onMount } from 'svelte';
    import { nip19 } from "nostr-tools";
    import { writable } from 'svelte/store';
    import { convertTimestamp, copyTextToClipboard, generateQRCode, parseContent, zapAction } from '$lib/utils.js';
    import './gm.css';

    const ndk = new NDK({
        explicitRelayUrls: [ "wss://nostr.mom", "wss://relay.primal.net", "wss://nos.lol", "wss://nostr.thank.eu", "wss://nostr.wine", "wss://relay.damus.io", "wss://purplepag.es", "wss://lunchbox.sandwich.farm", "wss://fiatjaf.com", "wss://nostr.8777.ch", "wss://relay.snort.social", "wss://eden.nostr.land", "wss://offchain.pub", "wss://nostr.bitcoiner.social", "wss://yabu.me", "wss://relay.nostr.sc", "wss://nostr.land", "wss://relay.nostr.info", "wss://relay.exit.pub", "wss://nostr.yuv.al", "wss://nostr.javi.space", "wss://no.str.cr", "wss://relay.nostrati.com", "wss://relay.nostr.com.au", "wss://relay.nip05.cf", "wss://nostr.oxtr.dev" ],
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
    let filteredLud06 = [];
    let filteredLud16 = [];
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

    function handleHoverzzz(event) {
        hoveredNote = event.currentTarget;
        const audio = new Audio('/thunder.mp3');
        audio.volume = 0.3;
        audio.play();
    }

    function handleHoverb(event) {
        hoveredNote = event.currentTarget;
        const audio = new Audio('/balloon.mp3');
        audio.volume = 0.05;
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
            const requiredWords = [
                "gm", "gn", "good morning", "good night", "good morrow"
            ];

            const includesRequiredWord = requiredWords.some(word => {
                const wordRegex = new RegExp('\\b' + word + '\\b', 'i');
                return wordRegex.test(content);
            });

            if (!includesRequiredWord || receivedEvent.tags.some(tag => tag[0] === "e")) {
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
                subz.on('error', (error) => {
                    console.error('Subscription error:', error);
                    handleError();
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
            console.log(combinedEvent)
            if (!uniqueEventIds.has(eventId)) {
                uniqueEventIds.add(eventId);
                eventszFromSubscription.push(combinedEvent);

                filteredName.push(combinedEvent.kind0.name);
                filteredPicture.push(combinedEvent.kind0.picture || 'https://www.nicepng.com/png/detail/101-1019050_no-picture-taking-sign.png');
                filteredAbout.push(combinedEvent.kind0.about);
                filteredWeb.push(combinedEvent.kind0.website);
                filteredNpub.push(combinedEvent.kind0.npub);
                filteredNip19.push(combinedEvent.kind0.nip19);
                filteredLud06.push(combinedEvent.kind0.lud06);
                filteredLud16.push(combinedEvent.kind0.lud16);

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
        const audio = new Audio('/ding.mp3');
        audio.volume = 0.03;
        audio.play();
        try {
            user = await signer.user();
            user.ndk = ndk;
            await user.fetchProfile();
            isUserLoggedIn = true;
        } catch (error) {
            console.error("Error occurred during login:", error);
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
                        <p class="text">This is the gm edition. All you get in good morning and good night wishes.</p>
                        <p class="date">That's right! What nostr really needs is less nostr talk. It's too recursive. So...I've censored that out for you. Welcome to a highly censored client on the world's most censorship-resistant protocol. Face it, you're aunt Lisa will never enjoy spending time on nostr reading about nostr. But she might enjoy reading stuff here.</p>
                        <p class="text">If you don't like all my rules, no worries. Find another client. Best of luck finding these 90s pizza party colors somewhere else though!</p>
                    </div>
                {/await}
            {/if}
        {/if}
    </div>
    <div class="right">
        <button class="login" on:click={login} on:mouseover={handleHoverb} on:focus={handleFocus}>Login</button>
        {#if isLoading}
            <p class="loading">Horses: hold 'em.</p>
            {:else}
            {#if isUserLoggedIn}
                {#await user.fetchProfile() then events}
                    <h2>{user.profile?.name}</h2>
                    <p>
                        <img src={user.profile?.image} on:mouseover={handleHoverb} on:focus={handleFocus} class="click-me" alt="NOPICTURE" />
                    </p>
                    <p>{user.profile?.about}</p>
                    <a class="peep" href={user.profile?.website} target="blank">Here's a link to your Website!</a>
                    <p class="peep" on:click={() => copyTextToClipboard(user.profile?.lud16)} title="Click to copy">{user.profile?.lud16}</p>
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
                        {#if combinedEvent.kind1.subject}
                            <h2>{combinedEvent.kind1.subject}</h2>
                        {/if}
                        <p class="text">{@html parseContent(combinedEvent.kind1.content)}</p>
                        <p class="date">{convertTimestamp(combinedEvent.kind1.created_at)}</p>
                        {#if combinedEvent.kind0.lud06 || combinedEvent.kind0.lud16}
                            <button class="zap" on:mouseenter={handleHoverzzz} on:focus={handleFocus} on:click={() => zapAction(user, combinedEvent.kind1)}>THUNDER!</button>
                        {/if}
                    </div>
                {/if}
            </div>

            <div class="right">
                {#if isLoading}
                    <p class="loading">Horses: hold 'em.</p>
                {:else}
                    <h2>{combinedEvent.kind0.name}</h2>
                    <p>
                        <img src={combinedEvent.kind0.picture || 'https://www.nicepng.com/png/detail/101-1019050_no-picture-taking-sign.png'} class="click-me" alt="NOPICTURE" on:click={() => zapAction(user, combinedEvent.kind1)} on:mouseover={handleHoverb} on:focus={handleFocus}/>
                    </p>
                    <p class="about">{@html parseContent(combinedEvent.kind0.about)}</p>
                    {#if combinedEvent.kind0.website}
                        <a class="peep" href={combinedEvent.kind0.website} target="blank">{combinedEvent.kind0.name}'s Website</a>
                    {/if}
                    <p class="about" on:click={() => copyTextToClipboard(nip19.npubEncode(combinedEvent.kind1.pubkey))} title="Click to copy ">{nip19.npubEncode(combinedEvent.kind1.pubkey)}</p>
                    {#if combinedEvent.kind0.lud06}
                        <p class="peep" on:click={() => copyTextToClipboard(combinedEvent.kind0.lud06)} title="Click to copy ">{combinedEvent.kind0.lud06}</p>
                    {/if}
                    {#if combinedEvent.kind0.lud16}
                        <p class="peep" on:click={() => copyTextToClipboard(combinedEvent.kind0.lud16)} title="Click to copy ">{combinedEvent.kind0.lud16}</p>
                    {/if}
                {/if}
            </div>
        {/if}
    </div>
{/each}

<footer>
    <p>
        NOSTRMINUSNOSTR presents GM hell
    </p>
    <p>
        Welcome to nostrminusnostr, GM edition. Here you will find an international feed of nothing but gm related content, powered by the internet's most censorship-resistant protocol. There is no need to login if you just hope to catch up on the news. If you are familiar with the practice of zapping, and would like to login, you can use any web-extention signer.
    </p>
    <p>
        It takes a moment to load up the notes. Please be patient and know that if you can still read the "hold your horses" statements above, the program is still loading.
    </p>
</footer>