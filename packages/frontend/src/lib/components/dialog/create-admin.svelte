<script lang="ts">
  import { mediaQuery } from "svelte-legos";
  import { LoaderCircle } from "lucide-svelte/icons";
  import { showDialogToast } from "@/utils";
  import { createAdminUser, getSession, type AdminUserModel } from "@/service";
  import * as Dialog from "@/components/ui/dialog/index.js";
  import * as Drawer from "@/components/ui/drawer/index.js";
  import { Button } from "@/components/ui/button/index.js";
  import { Input } from "@/components/ui/input/index.js";
  import { Label } from "@/components/ui/label/index.js";
  import { createEventDispatcher } from "svelte";

  export let show: boolean = false;

  async function onCreate() {
    requestOngoing = true;

    errorMessage = {};

    if (!userDetail.username) {
      errorMessage.username = "Required field";
      requestOngoing = false;
      return;
    }

    if (!userDetail.password) {
      errorMessage.password = "Required field";
      requestOngoing = false;
      return;
    }

    try {
      let session = await getSession();

      if (!session.data) {
        requestOngoing = false;
        show = false;
        dispatch("sessionError");
        return;
      }

      let { error } = await createAdminUser({
        accessToken: session.data.accessToken,
        username: userDetail.username,
        password: userDetail.password,
      });

      if (error) {
        requestOngoing = false;

        if (error.code == 2008) {
          dispatch("sessionError");
        } else if (error.code == 2006) {
          errorMessage.username = error.message;
          return;
        } else {
          showDialogToast("ERROR", "Request failed", error.message);
        }
        show = false;

        return;
      }

      showDialogToast(
        "SUCCESS",
        "Request successfully",
        "Account successfully created"
      );
    } catch (error) {
      showDialogToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    show = false;
  }

  let requestOngoing: boolean = false;
  let isDesktop = mediaQuery("(min-width: 768px)");
  let dispatch = createEventDispatcher();
  let errorMessage: Partial<Record<keyof AdminUserModel, string>> = {};
  let userDetail: Partial<{ password: string; username: string }> = {};

  $: if (show != false) {
    errorMessage = {};
    userDetail = {};
  }
</script>

{#if $isDesktop}
  <Dialog.Root
    closeOnEscape={!requestOngoing}
    closeOnOutsideClick={!requestOngoing}
    bind:open={show}
  >
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>Create account</Dialog.Title>
        <Dialog.Description>
          Create a new account here. Click create when you're done.
        </Dialog.Description>
      </Dialog.Header>
      <form class="grid items-start gap-4">
        <div class="grid gap-2">
          <Label for="username">Username</Label>
          <Input
            type="username"
            id="username"
            bind:value={userDetail.username}
          />
          <p
            class="text-sm font-medium text-red-600 {!errorMessage.username &&
              'hidden'}"
          >
            {errorMessage.username}
          </p>
        </div>
        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            type="password"
            bind:value={userDetail.password}
          />
          <p
            class="text-sm font-medium text-red-600 {!errorMessage.password &&
              'hidden'}"
          >
            {errorMessage.password}
          </p>
        </div>
        <Button type="submit" on:click={onCreate} disabled={requestOngoing}>
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing ? "Create" : "Please wait"}
        </Button>
      </form>
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Drawer.Root
    closeOnEscape={!requestOngoing}
    closeOnOutsideClick={!requestOngoing}
    bind:open={show}
  >
    <Drawer.Content>
      <Drawer.Header class="text-left">
        <Drawer.Title>Create account</Drawer.Title>
        <Drawer.Description>
          Create a new account here. Click create when you're done.
        </Drawer.Description>
      </Drawer.Header>
      <form class="grid items-start gap-4 px-4">
        <div class="grid gap-2">
          <Label for="username">Username</Label>
          <Input
            type="username"
            id="username"
            bind:value={userDetail.username}
          />
          <p
            class="text-sm font-medium text-red-600 {!errorMessage.username &&
              'hidden'}"
          >
            {errorMessage.username}
          </p>
        </div>
        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            type="password"
            bind:value={userDetail.password}
          />
          <p
            class="text-sm font-medium text-red-600 {!errorMessage.password &&
              'hidden'}"
          >
            {errorMessage.password}
          </p>
        </div>
        <Button type="submit" on:click={onCreate} disabled={requestOngoing}>
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing ? "Create" : "Please wait"}
        </Button>
      </form>
      <Drawer.Footer class="pt-2">
        <Drawer.Close disabled={requestOngoing} asChild let:builder>
          <Button variant="outline" builders={[builder]}>Cancel</Button>
        </Drawer.Close>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Root>
{/if}
