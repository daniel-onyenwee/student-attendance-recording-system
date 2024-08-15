<script lang="ts">
  import {
    NotebookPen,
    Sun,
    Moon,
    Settings,
    UserRoundCog,
    LogIn,
    UserRound,
  } from "lucide-svelte";
  import type { LayoutData } from "./$types";
  import * as DropdownMenu from "@/components/ui/dropdown-menu";
  import { Button } from "@/components/ui/button";
  import { resetMode, setMode } from "mode-watcher";
  import {
    StudentAccountDialog,
    SessionAlertDialog,
    StudentRecordDialog,
  } from "@/components/dialog";

  export let data: LayoutData;

  function onSessionError() {
    sessionAlertDialog.show();
  }

  let sessionAlertDialog: SessionAlertDialog;
  let studentAccountDialog: StudentAccountDialog;
  let studentDetailDialog: StudentRecordDialog;
</script>

<svelte:head>
  <title>Dashboard | Student</title>
</svelte:head>

<main class="flex min-h-screen w-full flex-col bg-muted/40 pb-6 sm:gap-4">
  <header
    class="sticky top-0 z-30 flex h-16 justify-between items-center gap-4 border-b bg-background px-4 py-3 sm:px-10 md:px-12"
  >
    <a
      href="/student"
      class="flex bg-primary items-center text-background p-1 rounded-lg"
    >
      <NotebookPen size={25} />
    </a>
    <div class="gap-4 flex justify-center items-center">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <Button builders={[builder]} variant="outline" size="icon">
            <Sun
              class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            />
            <Moon
              class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            />
            <span class="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item on:click={() => setMode("light")}>
            Light
          </DropdownMenu.Item>
          <DropdownMenu.Item on:click={() => setMode("dark")}>
            Dark
          </DropdownMenu.Item>
          <DropdownMenu.Item on:click={() => resetMode()}>
            System
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <Button variant="outline" size="icon" builders={[builder]}>
            <Settings
              class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all"
            />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Label>Settings</DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            on:click={() => studentDetailDialog.show("VIEW", data.user)}
          >
            <UserRound class="mr-2 h-4 w-4" />
            Account Detail
          </DropdownMenu.Item>
          <DropdownMenu.Item
            on:click={() => studentAccountDialog.show(data.user)}
          >
            <UserRoundCog class="mr-2 h-4 w-4" />
            Edit account
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item href="/logout">
            <LogIn class="mr-2 h-4 w-4" />
            Logout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </header>
  <section class="p-4 sm:py-0 sm:px-10 md:px-12">
    <slot />
  </section>
</main>

<SessionAlertDialog bind:this={sessionAlertDialog} />
<StudentAccountDialog
  accessToken={data.session.accessToken}
  bind:user={data.user}
  on:sessionError={onSessionError}
  bind:this={studentAccountDialog}
/>
<StudentRecordDialog
  userType="LECTURER"
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  bind:this={studentDetailDialog}
/>
