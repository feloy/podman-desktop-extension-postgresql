<script lang="ts">
// app.css includes tailwind css dependencies that we use
import './app.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { router } from 'tinro';
import Route from './lib/Route.svelte';
import { onMount } from 'svelte';
import { getRouterState } from './api/client';
import Services from './lib/services/Services.svelte';
import CreateService from './lib/create/CreateService.svelte';
import ServiceDetails from './lib/details/ServiceDetails.svelte';

// Using our router instance, we can determine if the application has been mounted.
router.mode.hash();
let isMounted = false;

onMount(() => {
  // Load router state on application startup
  const state = getRouterState();
  router.goto(state.url);
  isMounted = true;
});
</script>

<!--
  This is the main application component. It is the root component of the application.
  It is responsible for rendering the application layout and routing the application to the correct page.

  For example, the main page of the application is the "HelloWorld" svelte component.$derived

  This can be expanded more by including more Route paths which the application can navigate too, for example /about, /contact etc.
-->
<main class="flex flex-col w-screen h-screen overflow-hidden bg-[var(--pd-content-bg)]">
  <div class="flex flex-row w-full h-full overflow-hidden">
    <Route path="/*" breadcrumb="PostgreSQL" isAppMounted={isMounted} let:meta>
      <Route path="/" breadcrumb="Services Page">
        <Services />
      </Route>
    </Route>
    <Route path="/:id/*" let:meta>
      {#if meta.params.id === 'create'}
        <CreateService />
      {:else}
        <ServiceDetails containerId={meta.params.id} />
      {/if}
    </Route>
  </div>
</main>
