<script lang="ts">
  import { mediaQuery } from "svelte-legos";
  import { LoaderCircle } from "lucide-svelte/icons";
  import { showDialogToast } from "@/utils";
  import { deleteAdminUser, getSession } from "@/service";
  import * as Dialog from "@/components/ui/dialog/index.js";
  import * as Drawer from "@/components/ui/drawer/index.js";
  import { Button } from "@/components/ui/button/index.js";
  import { goto } from "$app/navigation";
  import { Input } from "@/components/ui/input/index.js";
  import { Label } from "@/components/ui/label/index.js";
  import { createEventDispatcher } from "svelte";

  export let show: boolean = false;
  export let userPassword: string;

  async function onDelete() {
    requestOngoing = true;

    errorMessage = "";

    if (!password) {
      errorMessage = "Required field";
      requestOngoing = false;
      return;
    }

    if (password != userPassword) {
      errorMessage = "Incorrect password";
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

      let { error } = await deleteAdminUser({
        accessToken: session.data.accessToken,
      });

      if (error) {
        requestOngoing = false;
        show = false;

        showDialogToast("ERROR", "Request failed", error.message);
        return;
      }

      showDialogToast(
        "SUCCESS",
        "Request successfully",
        "Account successfully deleted",
        async () => {
          await goto("/login");
        }
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
  let errorMessage: string = "";
  let password: string;

  $: if (show != false) {
    errorMessage = "";
    password = "";
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
        <Dialog.Title>Delete account</Dialog.Title>
        <Dialog.Description>
          This action cannot be undone. This will permanently delete your
          account and remove your data from our servers.
        </Dialog.Description>
      </Dialog.Header>
      <form class="grid items-start gap-4">
        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <Input type="password" id="password" bind:value={password} />
          <p
            class="text-sm font-medium text-red-600 {!errorMessage && 'hidden'}"
          >
            {errorMessage}
          </p>
        </div>
        <Button
          on:click={onDelete}
          disabled={requestOngoing}
          variant="destructive"
        >
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing ? "Delete" : "Please wait"}
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
        <Drawer.Title>Delete account</Drawer.Title>
        <Drawer.Description>
          This action cannot be undone. This will permanently delete your
          account and remove your data from our servers.
        </Drawer.Description>
      </Drawer.Header>
      <form class="grid items-start gap-4 px-4">
        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <Input type="password" id="password" bind:value={password} />
          <p
            class="text-sm font-medium text-red-600 {!errorMessage && 'hidden'}"
          >
            {errorMessage}
          </p>
        </div>
        <Button
          on:click={onDelete}
          disabled={requestOngoing}
          variant="destructive"
        >
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing ? "Delete" : "Please wait"}
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
