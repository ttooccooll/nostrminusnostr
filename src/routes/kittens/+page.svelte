<script>
    import NDK, { NDKEvent, NDKNip07Signer } from "@nostr-dev-kit/ndk";
    import {browser} from '$app/environment';
    import { onMount } from 'svelte';
    import { nip19 } from "nostr-tools";
    import { writable } from 'svelte/store';
    import QRCode from 'qrcode-generator';
    import './kittens.css';

    const ndk = new NDK({
        explicitRelayUrls: [ "wss://fiatjaf.com", "wss://relay.damus.io", "wss://relay.primal.net", "wss://relay.bitcoinpark.com" ],
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
    
    const eventsPromise = ndk.fetchEvents({kinds:[1], npub:[
        "npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m",
        "npub1a2cww4kn9wqte4ry70vyfwqyqvpswksna27rtxd8vty6c74era8sdcw83a",
        "npub18psflzah8gjq54t4zyjhezghzg9pvpjhm894f4yex9wpl79t3uxq03v73m",
        "npub1qny3tkh0acurzla8x3zy4nhrjz5zd8l9sy9jys09umwng00manysew95gx",
        "npub1lrnvvs6z78s9yjqxxr38uyqkmn34lsaxznnqgd877j4z2qej3j5s09qnw5",
        "npub1cn4t4cd78nm900qc2hhqte5aa8c9njm6qkfzw95tszufwcwtcnsq7g3vle",
        ]});
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

    function fetchEventFromSub() {
        const sub = ndk.subscribe({ kinds: [1] },
            { closeOnEose: false });
        let matchedEvents = [];
        let combinedEvents = {};
        let retryCount = 0;
        const maxRetries = 5;

        const handleError = () => {
            if (retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000;
                retryCount++;
                setTimeout(() => fetchEventFromSub(), delay);
            } else {
                console.error('Max retries reached. Could not fetch events.');
            }
        };

        sub.on('event', (receivedEvent) => {
            let content = receivedEvent.content;
            const wordCount = content.split(/\s+/).length;

            const replacements = {
                nostr: "cute kitten",
                relay: "kitten",
                relays: "kittens",
                client: "kitten",
                clients: "kittens",
                nip: "kitten",
                nips: "kittens",
                bitcoin: "puppy",
                bitcoins: "puppies",
                bitcoiner: "puppy dog",
                bitcoiners: "puppy dogs",
                btc: "a cute little puppy",
                kyc: "kitty litter",
                cbdc: "doggy doo-doo",
                tech: "puppies",
                utxo: "puppy",
                mempool: "puppy",
                mempools: "puppies",
                lightning: "puppies",
                ln: "puppies",
                zaps: "puppies",
                sat: "puppy",
                sats: "puppies"
            };

            for (const [key, value] of Object.entries(replacements)) {
                const regex = new RegExp(`\\b${key}\\b`, 'gi');
                content = content.replace(regex, value);
            }

            const excludedWords = Object.keys(replacements);
            const pattern = excludedWords.join("|");
            const regex = new RegExp(pattern, "i");

            if (receivedEvent.tags.some(tag => tag[0] === "e") || wordCount < 3 || regex.test(content)) {
                return;
            }

            receivedEvent.content = content;

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

    let dogFact = null;
    let catImageUrl = null;
    let dogImageUrl = null;

    async function fetchFact() {
        try {
            const response = await fetch('https://dogapi.dog/api/v2/facts');
            const data = await response.json();
            dogFact = data.data[0].attributes.body; 
        } catch (error) {
            console.error('Error fetching the dog', error);
        }
    };

    async function fetchCatImage() {
        try {
            const response = await fetch('https://api.thecatapi.com/v1/images/search');
            const data = await response.json();
            catImageUrl = data[0].url;
        } catch (error) {
            console.error('Error fetching cat image', error);
        }
    }

    async function fetchDogImage() {
        try {
            const response = await fetch('https://dog.ceo/api/breeds/image/random');
            const data = await response.json();
            dogImageUrl = data.message;
        } catch (error) {
            console.error('Error fetching dog image', error);
        }
    }

    fetchFact();
    fetchCatImage();
    fetchDogImage();

    function parseContent(content) {
        if (content) {
            const urlRegex = /(https?:\/\/[^\s'"<>()?]+)/g;
            content = content.replace(urlRegex, url => {
                if (/\.(png|jpg|jpeg|gif|bmp)$/i.test(url)) {
                    const randomImage = Math.random() < 0.5 ? catImageUrl : dogImageUrl;
                    return `<img src="${randomImage}" class="notez" />`;
                } else if (/\.(mp4|webm)$/i.test(url)) {
                    return `<video controls class="notez"><source src="${url}" type="video/mp4"></video>`;
                } else if (/\.(mp3|wav)$/i.test(url)) {
                    return `<audio controls class="notez"><source src="${url}" type="audio/mpeg"></audio>`;
                } else {
                    return `<a href="${url}" target="_blank">${url}</a>`;
                }
            });
            return content;
        } else {
            return `
                I have not written a profile. Ergo, the nostrminusnostr devs will now share with you a fun dog fact: ${dogFact || 'Loading...'}
            `;
        }
    };

    async function zapAction(kind1Event) {
        const audio = new Audio('/ding.mp3');
        audio.volume = 0.03;
        audio.play();
        if (!user || !kind1Event) return;
        const event = kind1Event;
        const amount = 2000000;
        const comment = prompt("You are about to cast a 2000 sat thunderbolt on this note. Speak your mind if you like!") || "";

        try {
            console.log(kind1Event);
            const paymentRequest = await event.zap(amount, comment);
            const modal = document.createElement('div');
            const qrCodeData = generateQRCode(paymentRequest);
            const qrCodeImgTag = qrCodeData.createImgTag(4);
            modal.style.position = 'fixed';
            modal.style.top = '50%';
            modal.style.left = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.padding = '20px';
            modal.style.background = 'black';
            modal.style.color = 'white';
            modal.style.border = '1px solid #ccc';
            modal.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
                <p>Call down the thunder!</p>
                <div class="qr-code">${qrCodeImgTag}</div>
                </br>
                <textarea class="paymentRequest" rows="5" cols="50">${paymentRequest}</textarea>
                </br>
                <button class="zap" onclick="copyPaymentRequest()">Copy</button>
                </br>
                <span class="close" onclick="closeModal()">&times;</span>
            `;
            document.body.appendChild(modal);
            const closeButton = modal.querySelector('.close');
            closeButton.onclick = function() {
                modal.style.display = "none";
            };
            window.copyPaymentRequest = function() {
                const paymentRequestTextarea = document.querySelector('.paymentRequest');
                paymentRequestTextarea.select();
                document.execCommand('copy');
            };
        } catch (error) {
            console.error("Error zapping funds:", error);
            alert("You can't zap this note. The author hasn't provided a payout address.");
        }
    }

    function copyTextToClipboard(text) {
        var tempInput = document.createElement("input");
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
    }

    function generateQRCode(paymentRequest) {
        const typeNumber = 0;
        const errorCorrectionLevel = 'L';
        const qr = QRCode(typeNumber, errorCorrectionLevel);
        qr.addData(paymentRequest);
        qr.make();
        return qr;
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
                            <button class="zap" on:mouseenter={handleHoverzzz} on:focus={handleFocus} on:click={() => zapAction(combinedEvent.kind1)}>THUNDER!</button>
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
                        <img src={combinedEvent.kind0.picture || 'https://www.nicepng.com/png/detail/101-1019050_no-picture-taking-sign.png'} class="click-me" alt="NOPICTURE" on:click={() => zapAction(combinedEvent.kind1)} on:mouseover={handleHoverb} on:focus={handleFocus}/>
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
    <p class="date">
        You've arrived at the kittens and puppies area. Unlike other areas of nostrminusnostr, here you may read notes about nostr and bitcoin. However, the actual words are still censored. In fact, they're replaced with kittens and puppies! The same is true of all words related to the subjects and any images, regardless of their content. Enjoy...or don't. The choice is yours.
    </p>
</footer>