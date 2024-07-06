<script lang="ts">
  import { mediaQuery } from "svelte-legos";
  import { LoaderCircle } from "lucide-svelte/icons";
  import { showDialogToast } from "@/utils";
  import { updateAdminUser, getSession, type AdminUserModel } from "@/service";
  import * as Dialog from "@/components/ui/dialog/index.js";
  import * as Drawer from "@/components/ui/drawer/index.js";
  import { Button } from "@/components/ui/button/index.js";
  import { Input } from "@/components/ui/input/index.js";
  import { Label } from "@/components/ui/label/index.js";
  import { createEventDispatcher } from "svelte";

  export let show: boolean = false;
  export let user: AdminUserModel;

  async function onSave() {
    requestOngoing = true;

    errorMessage = {};

    if (!clonedUser.username) {
      errorMessage.username = "Required field";
      requestOngoing = false;
      return;
    }

    if (!clonedUser.password) {
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

      let { error } = await updateAdminUser({
        accessToken: session.data.accessToken,
        username: clonedUser.username,
        password: clonedUser.password,
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

      user.password = clonedUser.password;
      user.username = clonedUser.username;

      showDialogToast(
        "SUCCESS",
        "Request successfully",
        "Account successfully edited"
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
  let clonedUser = { ...user };

  $: if (show != false) {
    errorMessage = {};
  } else {
    clonedUser = { ...user };
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
        <Dialog.Title>Edit account</Dialog.Title>
        <Dialog.Description>
          Make changes to your account here. Click save when you're done.
        </Dialog.Description>
      </Dialog.Header>
      <form class="grid items-start gap-4">
        <div class="grid gap-2">
          <Label for="username">Username</Label>
          <Input
            type="username"
            id="username"
            bind:value={clonedUser.username}
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
            bind:value={clonedUser.password}
          />
          <p
            class="text-sm font-medium text-red-600 {!errorMessage.password &&
              'hidden'}"
          >
            {errorMessage.password}
          </p>
        </div>
        <Button type="submit" on:click={onSave} disabled={requestOngoing}>
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing ? "Save" : "Please wait"}
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
        <Drawer.Title>Edit account</Drawer.Title>
        <Drawer.Description>
          Make changes to your account here. Click save when you're done.
        </Drawer.Description>
      </Drawer.Header>
      <form class="grid items-start gap-4 px-4">
        <div class="grid gap-2">
          <Label for="username">Username</Label>
          <Input
            type="username"
            id="username"
            bind:value={clonedUser.username}
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
            bind:value={clonedUser.password}
          />
          <p
            class="text-sm font-medium text-red-600 {!errorMessage.password &&
              'hidden'}"
          >
            {errorMessage.password}
          </p>
        </div>
        <Button type="submit" on:click={onSave} disabled={requestOngoing}>
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing ? "Save" : "Please wait"}
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
