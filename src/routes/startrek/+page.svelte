<script>
    import NDK, { NDKEvent, NDKNip07Signer } from "@nostr-dev-kit/ndk";
    import {browser} from '$app/environment';
    import { onMount, onDestroy } from 'svelte';
    import { nip19 } from "nostr-tools";
    import { writable } from 'svelte/store';
    import { convertTimestamp, copyTextToClipboard, generateQRCode, parseContent, zapAction } from '$lib/utils.js';
    import './star.css';
    import { gsap } from 'gsap';

    const ndk = new NDK({
        explicitRelayUrls: [ "wss://nostr.mom", "wss://relay.primal.net", "wss://nos.lol", "wss://nostr.thank.eu", "wss://nostr.wine", "wss://relay.damus.io", "wss://purplepag.es", "wss://lunchbox.sandwich.farm", "wss://fiatjaf.com", "wss://nostr.8777.ch", "wss://relay.snort.social", "wss://eden.nostr.land", "wss://offchain.pub", "wss://nostr.bitcoiner.social", "wss://yabu.me", "wss://relay.nostr.sc", "wss://nostr.land", "wss://relay.nostr.info", "wss://nostr.oxtr.dev", "wss://relay.0xchat.com", "wss://nostr-01.yakihonne.com", "wss://nostr.superfriends.online", "wss://relay.nos.social", "wss://relay.getalby.com", "wss://relay.nostr.net" ],
    });

    let sub = null;
    let isLoading = true;
 
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

    if (browser) {
        ndk.connect().then(() => {
            console.log('Connected');
            requestAnimationFrame(fetchEventFromSub);
            setTimeout(() => { isLoading = false; }, 15000);
        });
    }
    




    function handleError() {}

    let hoveredNote = null;

    function handleHover(event) {
        hoveredNote = event.currentTarget;
        const audio = new Audio('/pageturn.mp3');
        audio.volume = 0.04;
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
        const audio = new Audio('/pageturn.mp3');
        audio.volume = 0.01;
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
        const audio = new Audio('/wastebin.mp3');
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

    onDestroy(() => sub?.stop());

    onMount(() => {
        document.querySelectorAll('.note .numbering').forEach(item => {
            item.addEventListener('click', handleDestroy);
        });
    });

    const now = Math.floor(Date.now() / 1000);
    const lastMonth = now - (30 * 24 * 60 * 60);

    function fetchEventFromSub() {
        sub = ndk.subscribe({ kinds: [1], created_at: { $gte: lastMonth } }, { closeOnEose: false });
        let matchedEvents = [];
        let combinedEvents = {};

        sub.on('event', (receivedEvent) => {
            const content = receivedEvent.content;
            const requiredWords = [
                "star trek", "trekkie", "picard", "kirk", "deep space nine",
                "deep space 9", "tng", "ds9", "klingon", "stv", "star trek voyager",
                "janeway", "sisco", "klingon", "spock", "vulcan", "romulan",
                "prime directive", "riker", "ferengi"
                // "science", "chemistry", "physics", "biology", "zoology", "astronomy",
                // "geology", "oceanography", "biochemistry", "microbiology", "botany",
                // "nasa", "seti", "space travel", "outer space", "galaxies",
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
                distributeCombinedEvents(combinedEvents[hexpubkey]);

                const subz = ndk.subscribe({ kinds: [0], authors: [hexpubkey] }, { closeOnEose: false });

                subz.on('event', (receivedKind0Event) => {
                    try {
                        const parsedContent = JSON.parse(receivedKind0Event.content);
                        combinedEvents[hexpubkey].kind0 = parsedContent;
                        subz.stop();
                        distributeCombinedEvents(combinedEvents[hexpubkey]);
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
            isLoading = false;
            matchedEvents.forEach(event => {
                distributeCombinedEvents(combinedEvents[event.pubkey]);
            });
        });
    }

    const uniqueEventIds = new Set();

    function distributeCombinedEvents(combinedEvent) {
        if (!combinedEvent.kind1) {
            return;
        }
        const eventId = combinedEvent.kind1.id;
        console.log(combinedEvent)
        if (!uniqueEventIds.has(eventId)) {
            uniqueEventIds.add(eventId);
            eventszFromSubscription.push(combinedEvent);

            filteredName.push(combinedEvent.kind0?.name);
            filteredPicture.push(combinedEvent.kind0?.picture || 'https://www.nicepng.com/png/detail/101-1019050_no-picture-taking-sign.png');
            filteredAbout.push(combinedEvent.kind0?.about);
            filteredWeb.push(combinedEvent.kind0?.website);
            filteredNpub.push(combinedEvent.kind0?.npub);
            filteredNip19.push(combinedEvent.kind0?.nip19);
            filteredLud06.push(combinedEvent.kind0?.lud06);
            filteredLud16.push(combinedEvent.kind0?.lud16);

            eventszStore.set([...eventszFromSubscription]);
        } else if (combinedEvent.kind0) {
            const idx = eventszFromSubscription.findIndex(e => e.kind1.id === eventId);
            if (idx !== -1) {
                eventszFromSubscription[idx] = { kind1: combinedEvent.kind1, kind0: combinedEvent.kind0 };
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









    function flipCard(event) {
        const card = event.currentTarget;
        gsap.to(card, { rotationY: 180, duration: 0.5, onComplete: () => {
            card.classList.toggle('flipped');
        } });
    }

    function flipBackCard(event) {
        const card = event.currentTarget;
        gsap.to(card, { rotationY: 0, duration: 0.5, onComplete: () => {
            card.classList.toggle('flipped');
        } });
    }

    const nowInMillis = Math.floor(Date.now());
    const currentDate = new Date(nowInMillis);
    const formattedDate = currentDate.toLocaleString();
    console.log("Current date and time:", formattedDate);

</script>

<div class="content">
    <div class="left">
        {#if isLoading}
            <p class="loading1">If you can read this, I'm still loading up some news. Please hold your horses for just one moment.</p>
            {:else}
            {#if isUserLoggedIn}
                    <div class="notes" on:mouseenter={handleHover} on:mouseleave={handleMouseLeave} on:focus={handleFocus} role="button" tabindex="0">
                      <div class="notess">
                        <p class="numbering" on:mouseover={handleHoverz} on:click={handleDestroy} on:focus={handleFocus} >Discard</p>
                        <p class="date">Congrats! You have successfully logged into nostrminusnostr. You can now see your own beautiful profile picture and zap some notes. Zaps on nostrminusnostr are always for 2000 sats. Why, you ask? I want you to only zap content that you really like, and I want it to actually make an impact for the writer. Given the size of the zaps, let's call them thunderbolts. I know that's not a real thing. Lightning has the bolts and thunder's just the noise, but hey, it sounds cooler.</p>
                        <p class="text">While here, you can enjoy this list of random longer notes. Yes, here you only ever get a global feed, which is not filtered by npubs you follow. So what's in it for you? This global feed is only of larger notes, and NONE of them are about nostr or even Bitcoin.</p>
                        <p class="date">That's right! What nostr really needs is less nostr talk. It's too recursive. So...I've censored that out for you. Welcome to a highly censored client on the world's most censorship-resistant protocol. Face it, you're aunt Lisa will never enjoy spending time on nostr reading about nostr. But she might enjoy reading stuff here.</p>
                        <p class="text">If you don't like all my rules, no worries. Find another client. Best of luck finding this campy UI anywhere else in the nostrverse!</p>
                      </div>
                    </div>
            {/if}
        {/if}
    </div>
    <div class="right">
        {#if isLoading}
            <p class="loading12"></p>
            {:else}
            {#if isUserLoggedIn}
                    <div class="balance-card"><div class="balance-content">{user.profile?.name}</div></div>
                    <p>
                        <img src={user.profile?.image} on:mouseover={handleHoverb} on:focus={handleFocus} class="click-me" alt="NOPICTURE" />
                    </p>
                    <p>{user.profile?.about}</p>
                    <a class="peep" href={user.profile?.website} target="blank">Here's a link to your Website!</a>
                    <p class="peep" on:click={() => copyTextToClipboard(user.profile?.lud16)} title="Click to copy">{user.profile?.lud16}</p>
            {/if}
        {/if}
            <button class="login1" on:click={login} on:mouseover={handleHoverb} on:focus={handleFocus}>Login</button>
    </div>
</div>

{#if !isLoading}
{#each eventszFromSubscription as combinedEvent}
    <div class="contentz">
        {#if combinedEvent.kind1}
            <div class="leftz">
                {#if isLoading}
                    <p class="loading1">If you can read this, I'm still loading up some news, so you can go right ahead and hold your horses for just a minute.</p>
                {:else}
                    <div class="notes" on:mouseenter={handleHover} on:mouseleave={handleMouseLeave} on:focus={handleFocus} role="button" tabindex="0">
                      <div class="notess">
                        <p class="numbering" on:mouseover={handleHoverz} on:click={handleDestroy} on:focus={handleFocus} >Discard</p>
                        {#if combinedEvent.kind1.subject}
                            <h2>{combinedEvent.kind1.subject}</h2>
                        {/if}
                        <p class="text">{@html parseContent(combinedEvent.kind1.content)}</p>
                        <p class="date">{convertTimestamp(combinedEvent.kind1.created_at)}</p>
                        {#if combinedEvent.kind0.lud06 || combinedEvent.kind0.lud16}
                            <button class="zap" on:mouseenter={handleHoverzzz} on:focus={handleFocus} on:click={() => zapAction(user, combinedEvent.kind1)}>Thunder</button>
                        {/if}
                      </div>
                    </div>
                {/if}
            </div>

            <div class="right" style="background:black, border:black">
                {#if isLoading}
                    <p class="loading12"></p>
                {:else}
                    <div class="balance-card"><div class="balance-content">{combinedEvent.kind0.name}</div></div>
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
{/if}

<div class="prefooter">
    <div class="inside-prefooterz">
        <p class="text">
            NOSTRMINUSNOSTR presents Star Trek News UNCENSORED
        </p>
    </div>
</div>    
<div class="moreprefooter">
    <div class="inside-prefooter">
        <p class="date">
            {formattedDate}
        </p>
    </div>
</div>
<div class="mostprefooter">
    <div class="inside-prefooter">
        <p class="text">
            Welcome to nostrminusnostr, trekkie edition. Here you will find an international feed of sports related content, powered by the internet's most censorship-resistant protocol. There is no need to login if you just hope to catch up on the news. If you are familiar with the practice of zapping, and would like to login, you can use any web-extention signer.
        </p>
        <p class="date">
            It takes a moment to load up the notes. Please be patient and know that if you can still read the "hold your horses" statements above, the program is still loading.
        </p>
    </div>
</div>