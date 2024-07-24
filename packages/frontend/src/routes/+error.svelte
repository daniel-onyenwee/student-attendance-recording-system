<script lang="ts">
  import { Button } from "@/components/ui/button";
  import { page } from "$app/stores";
</script>

<svelte:head>
  <title>
    {$page.status} - {$page.error?.message}
  </title>
</svelte:head>

<main class="h-screen w-screen flex justify-center flex-col items-center gap-4">
  <p class="text-7xl">Oops!</p>
  <p class="mt-2 text-lg">{$page.status} - {$page.error?.message}</p>
  <Button variant="outline" href="/">GO TO HOMEPAGE</Button>
</main>
