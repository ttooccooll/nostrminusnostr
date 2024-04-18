<script>
    import NDK, { NDKNip07Signer } from "@nostr-dev-kit/ndk";
    import {browser} from '$app/environment';
    import { onMount } from 'svelte';

    const ndk = new NDK({
        explicitRelayUrls: ["wss://relay.nostr.band", "wss://relay.damus.io", "wss://purplepag.es", "wss://relay.primal.net", "wss://nostr.land", "wss://nostr.wine", "wss://history.nostr.watch", "wss://lunchbox.sandwich.farm", "wss://fiatjaf.com",],
    });

    let isLoading = true;
    let events = []; 

    if (browser) {
        ndk.connect().then(() => {
            console.log('Connected' + explicitRelayUrls);
        });
    }

    const user = ndk.getUser({npub: 'npub1a95w2zch0gqfa0vhlgygz0xklwxccw6st88qkmhsk8d3tke2sqaqamsnzq'});
    const eventsPromise = ndk.fetchEvents({kinds:[1], limit:1000});
    // const profilesPromise = ndk.fetchEvents({kinds:[0], limit:100});

    eventsPromise.then(fetchedEvents => {
        events = fetchedEvents;
        isLoading = false;
    }).catch(error => {
        console.error('Error fetching events:', error);
        isLoading = false;
    });

    // profilesPromise.then(fetchedEvents => {
    //     events = fetchedEvents;
    //     isLoading = false;
    //     if (events.content) {
    //         const content = JSON.parse(events.content);
    //         console.log('Parsed content:', content);
    //     } else {
    //         console.error('Error: No content to parse');
    //     }
    // }).catch(error => {
    //     console.error('Error fetching events:', error);
    //     isLoading = false;
    // });


    console.log(user);

    function convertTimestamp(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    }

    let hoveredNote = null;

    function handleHover(event) {
        hoveredNote = event.currentTarget;
        try {
            const audio = new Audio('/drag.mp3');
            audio.volume = 0.1;
            audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    function handleHoverz(event) {
        hoveredNote = event.currentTarget;
        try {
            const audio = new Audio('/buzz.mp3');
            audio.volume = 0.1;
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
        audio.volume = 0.2;
        setTimeout(() => {
            note.remove();
        }, 1000);
    }

    onMount(() => {
        document.querySelectorAll('.note .numbering').forEach(item => {
            item.addEventListener('click', handleDestroy);
        });
    });

    async function login() {
        const signer = new NDKNip07Signer;
        ndk.signer = signer;
        signer.user().then((user) => {
            console.log(user);
        });
    }

</script>

<div class="content">
    <div class="left">
        {#if isLoading}
            <p class="loading">If you can read this, I'm loadin' up some notes right now, so you can go right ahead and hold your horses for just a minute. HOLD YOUR HORSES!</p>
        {:else}
            {#await eventsPromise then events}
                {#each Array.from(events).filter(event => {
                    const content = event.content;

                    const wordCount = content.split(/\s+/).length;
                    if (wordCount < 100) return false;

                    const excludedWords = ["nostr", "relay", "client", "bitcoin", "btc", "tech", "technology", "mempool", "lightning", "ln"];
                    const pattern = excludedWords.join("|");
                    const regex = new RegExp(pattern, "i");
                    if (regex.test(content)) return false;

                    return true;
                }) as event}
                    <div class="note" on:mouseenter={handleHover} on:mouseleave={handleMouseLeave} on:focus={handleFocus} role="button" tabindex="0">
                        <p class="numbering" on:mouseover={handleHoverz} on:click={handleDestroy} on:focus={handleFocus} >yuck!</p>
                        <p class="text">{event.content}</p>
                        <p class="date">{convertTimestamp(event.created_at)}</p>
                        <p class="peep">{event.pubkey}</p>
                    </div>
                {/each}
            {/await}
        {/if}
    </div>


    <!-- <div class="right">
        {#if isLoading}
        <p class="loading">Horses: hold 'em.</p>
        {:else}
            {#await profilesPromise then events}
                {#each Array.from(events).filter(event => {
                    console.log(event);
                    return true;
                }) as event}
                    <h2>{event.content}</h2>
                    <p>
                        <img src={user.profile?.image} class="click-me" alt="fdsa" />
                    </p>
                    <p>{event.pubkey}</p>
                {/each}
            {/await}
        {/if}
    </div> -->

    <div class="right">
        <button on:click={login}>Login</button>
        {#if isLoading}
            <p class="loading">Horses: hold 'em.</p>
        {:else}
            {#await user.fetchProfile() then events}
                <h2>{user.profile?.name}</h2>
                <p>
                    <img src={user.profile?.image} class="click-me" alt="fdsa" />
                </p>
                <p>{user.profile?.about}</p>
            {/await}
        {/if}
    </div>  

</div>