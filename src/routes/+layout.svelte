<script>
    import '../app.css';

    function navigateWithDelay(url) {
        setTimeout(() => {
            goto(url);
        }, 500);
    }

    document.querySelectorAll('nav a').forEach(function(link) {
        link.removeEventListener('mouseover', hoverEventHandler);
        link.removeEventListener('mouseout', hoverEventHandler);
    });
</script>

<style>
  nav a:hover {
    color: inherit !important;
    background-color: transparent !important;
  }
</style>

<div class="everybody">
    <h1>nostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminusnostrminus</h1>
    <slot />
</div>

<footer>
  <p>
    If you have feedback, or otherwise want to chat, check me out away from nostr at <a href="https://stacker.news/jasonb" target="_blank">Stacker News</a>.
  </p>
  <p>From here, you can discover where to discover me on nostr.</p>
  <p>We can hang out and talk Bitcoin or something like that.</p>
  <p>
    In the meantime, you may not and can not talk about Bitcoin or nostr here...at all.
  </p>
  <p>
    It's like <a href="https://garfieldminusgarfield.net" target="_blank">garfieldminusgarfield</a>, but not really.
  </p>
</footer>

<nav>
  <a on:click={() => navigateWithDelay('nostrminusnostr.vercel.app')} href="/">Home</a>
  <a on:click={() => navigateWithDelay('nostrminusnostr.vercel.app/pizza')} href="/pizza">Pizza Party</a>
  <a on:click={() => navigateWithDelay('nostrminusnostr.vercel.app/sports')} href="/sports">Sports</a>
  <a href="https://www.youtube.com/watch?v=sQnoZUR6fvY" target="_blank">Alt Coins</a>
</nav>
