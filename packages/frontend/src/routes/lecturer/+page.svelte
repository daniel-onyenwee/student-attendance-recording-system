<script lang="ts">
  import { Button } from "@/components/ui/button";
  import type { PageData } from "./$types";
  import {
    SessionAlertDialog,
    ClassAttendanceDialog,
  } from "@/components/dialog";
  import { goto } from "$app/navigation";

  export let data: PageData;
  let sessionAlertDialog: SessionAlertDialog;
  let classAttendanceDialog: ClassAttendanceDialog;
</script>

<svelte:head>
  <title>Dashboard | Lecturer</title>
</svelte:head>

<main
  class="flex justify-center flex-col items-center fixed gap-4 w-full h-full top-0 left-0 pl-0 sm:pt-16"
>
  <p class="text-muted-foreground text-7xl">Oops!</p>
  <p class="mt-2 text-lg text-muted-foreground">No class attendance started</p>
  <Button on:click={() => classAttendanceDialog.show("CREATE", undefined)}>
    Start Class attendance
  </Button>
</main>

<SessionAlertDialog bind:this={sessionAlertDialog} />
<ClassAttendanceDialog
  userType="LECTURER"
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={() => goto("./lecturer/class-attendance")}
  bind:this={classAttendanceDialog}
/>
