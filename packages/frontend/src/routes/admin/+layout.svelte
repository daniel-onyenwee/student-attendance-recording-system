<script lang="ts">
  import type { LayoutData } from "./$types";
  import { Sidebar } from "@/components/ui/sidebar/index.js";
  import * as DropdownMenu from "@/components/ui/dropdown-menu/index.js";
  import * as Sheet from "@/components/ui/sheet/index.js";
  import {
    PanelLeft,
    Settings,
    LogIn,
    UserRoundX,
    UserRoundPlus,
    UserRoundCog,
    Sun,
    Moon,
  } from "lucide-svelte";
  import { Button } from "@/components/ui/button/index.js";
  import * as AlertDialog from "@/components/ui/alert-dialog/index.js";
  import * as Breadcrumb from "@/components/ui/breadcrumb/index.js";
  import { resetMode, setMode } from "mode-watcher";
  import {
    DeleteAdminDialog,
    EditAdminDialog,
    CreateAdminDialog,
  } from "@/components/dialog/index.js";
  import { goto } from "$app/navigation";

  export let data: LayoutData;

  function onSessionError() {
    setTimeout(() => {
      showSessionExpiredAlertDialog = true;
    }, 200);
  }

  let showSessionExpiredAlertDialog = false;
  let showDeleteAdminDialog = false;
  let showEditAdminDialog = false;
  let showCreateAdminDialog = false;
  const BREADCRUMB_ITEMS_TO_DISPLAY = 3;
</script>

<svelte:head>
  <title>
    {data.pageTitle}
  </title>
</svelte:head>

<main class="flex min-h-screen w-full flex-col bg-muted/40">
  <aside
    class="fixed inset-y-0 left-0 z-10 hidden w-[250px] flex-col border-r bg-background sm:flex"
  >
    <Sidebar
      isMenuCollapsed={data.isMenuCollapsed}
      currentPage={data.currentPage}
    />
  </aside>
  <div class="flex flex-col pb-6 sm:gap-4 sm:pl-[250px]">
    <header
      class="sticky top-0 z-30 flex h-16 justify-between items-center gap-4 border-b bg-background px-4 py-3 sm:h-auto sm:px-6"
    >
      <Sheet.Root>
        <Sheet.Trigger asChild let:builder>
          <Button
            builders={[builder]}
            size="icon"
            variant="outline"
            class="sm:hidden"
          >
            <PanelLeft class="h-5 w-5" />
            <span class="sr-only">Toggle Menu</span>
          </Button>
        </Sheet.Trigger>
        <Sheet.Content side="left" class="sm:max-w-[250px]">
          <Sidebar
            isMenuCollapsed={data.isMenuCollapsed}
            currentPage={data.currentPage}
          />
        </Sheet.Content>
      </Sheet.Root>
      <Breadcrumb.Root class="hidden md:flex">
        <Breadcrumb.List class="text-base">
          {#if data.breadCrumbItems.length == 1}
            <Breadcrumb.Item>
              <Breadcrumb.Page class="capitalize">
                {data.breadCrumbItems[0].label}
              </Breadcrumb.Page>
            </Breadcrumb.Item>
          {:else}
            <Breadcrumb.Item>
              <Breadcrumb.Link
                href={data.breadCrumbItems[0].href}
                class="capitalize"
              >
                {data.breadCrumbItems[0].label}
              </Breadcrumb.Link>
            </Breadcrumb.Item>
          {/if}

          {#if data.breadCrumbItems.length > 1}
            {#each data.breadCrumbItems.slice(-BREADCRUMB_ITEMS_TO_DISPLAY + 1) as item}
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                {#if item.href == data.currentPage}
                  <Breadcrumb.Page
                    class="max-w-8 truncate md:max-w-none capitalize"
                  >
                    {item.label}
                  </Breadcrumb.Page>
                {:else}
                  <Breadcrumb.Link
                    href={item.href}
                    class="max-w-8 truncate md:max-w-none capitalize"
                  >
                    {item.label}
                  </Breadcrumb.Link>
                {/if}
              </Breadcrumb.Item>
            {/each}
          {/if}
        </Breadcrumb.List>
      </Breadcrumb.Root>
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
            <DropdownMenu.Item on:click={() => setMode("light")}
              >Light</DropdownMenu.Item
            >
            <DropdownMenu.Item on:click={() => setMode("dark")}
              >Dark</DropdownMenu.Item
            >
            <DropdownMenu.Item on:click={() => resetMode()}
              >System</DropdownMenu.Item
            >
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
            <DropdownMenu.Item on:click={() => (showCreateAdminDialog = true)}>
              <UserRoundPlus class="mr-2 h-4 w-4" />
              New account
            </DropdownMenu.Item>
            <DropdownMenu.Item on:click={() => (showEditAdminDialog = true)}>
              <UserRoundCog class="mr-2 h-4 w-4" />
              Edit account
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item href="/logout">
              <LogIn class="mr-2 h-4 w-4" />
              Logout
            </DropdownMenu.Item>
            <DropdownMenu.Item
              class="text-red-600 data-[highlighted]:bg-red-400 dark:data-[highlighted]:bg-destructive data-[highlighted]:text-white"
              on:click={() => (showDeleteAdminDialog = true)}
            >
              <UserRoundX class="mr-2 h-4 w-4" />
              Delete account
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </header>
    <section class="p-4 sm:px-6 sm:py-0">
      <slot />
    </section>
  </div>
</main>

<CreateAdminDialog
  bind:show={showCreateAdminDialog}
  on:sessionError={onSessionError}
/>

<EditAdminDialog
  bind:user={data.user}
  bind:show={showEditAdminDialog}
  on:sessionError={onSessionError}
/>

<DeleteAdminDialog
  bind:show={showDeleteAdminDialog}
  bind:userPassword={data.user.password}
  on:sessionError={onSessionError}
/>

<AlertDialog.Root
  closeOnOutsideClick={false}
  closeOnEscape={false}
  bind:open={showSessionExpiredAlertDialog}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Login session expired</AlertDialog.Title>
      <AlertDialog.Description>
        Your login session has expired. Please login to continue.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Action on:click={async () => await goto("/login")}
        >Login</AlertDialog.Action
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
