<script lang="ts">
  import { mediaQuery } from "svelte-legos";
  import { LoaderCircle } from "lucide-svelte/icons";
  import { showDialogToast } from "@/utils";
  import { createFaculty, updateFaculty, type FacultyModel } from "@/service";
  import * as Dialog from "@/components/ui/dialog";
  import * as Drawer from "@/components/ui/drawer";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher } from "svelte";
  import { Label } from "@/components/ui/label";
  import { Input } from "@/components/ui/input";

  export let accessToken: string;

  function show(mode: "CREATE", data: undefined): void;
  function show(mode: "UPDATE", data: FacultyModel): void;
  export function show(mode: "CREATE" | "UPDATE", data: any) {
    dialogMode = mode;
    if (mode == "UPDATE") {
      facultyData = structuredClone(data);
    }
    open = true;
  }

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    errorMessage = {};
    facultyData = {};
  }

  async function onCreateOrUpdate() {
    requestOngoing = true;

    errorMessage = {};

    if (!facultyData.name) {
      errorMessage.name = "Field required";
      requestOngoing = false;
      return;
    }

    try {
      let serviceRequest = null;

      if (dialogMode == "CREATE") {
        serviceRequest = await createFaculty({
          accessToken: accessToken,
          name: facultyData.name as string,
        });
      } else {
        serviceRequest = await updateFaculty({
          accessToken: accessToken,
          id: facultyData.id as string,
          name: facultyData.name as string,
        });
      }

      if (!serviceRequest) {
        throw new Error();
      }

      if (serviceRequest.error) {
        requestOngoing = false;
        if (
          serviceRequest.error.code >= 1001 &&
          serviceRequest.error.code < 1004
        ) {
          close();
          dispatch("onSessionError");
        } else if (serviceRequest.error.code == 3001) {
          errorMessage.name = serviceRequest.error.message;
        } else {
          close();
          showDialogToast(
            "ERROR",
            "Request failed",
            serviceRequest.error.message
          );
        }
        return;
      }

      showDialogToast(
        "SUCCESS",
        "Request successfully",
        `Faculty successfully ${dialogMode == "CREATE" ? "created" : "edited"}`
      );
      dispatch("onSuccessful");
    } catch (error) {
      showDialogToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let errorMessage: Partial<Record<keyof FacultyModel, string>> = {};
  let facultyData: Partial<FacultyModel> = {};
  let open = false;
  let dialogMode: "CREATE" | "UPDATE" = "CREATE";
  let isDesktop = mediaQuery("(min-width: 768px)");
  let dispatch = createEventDispatcher();

  $: dialogTitle = `${dialogMode == "CREATE" ? "Create" : "Edit"} faculty`;
  $: dialogDescription = `${
    dialogMode == "CREATE"
      ? "Create a new faculty here. Click create when you're done."
      : "Make changes to the faculty here. Click save when you're done."
  }`;
</script>

{#if $isDesktop}
  <Dialog.Root
    closeOnEscape={!requestOngoing}
    closeOnOutsideClick={!requestOngoing}
    onOpenChange={(open) => {
      if (!open) {
        internalClose();
      }
    }}
    bind:open
  >
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>{dialogTitle}</Dialog.Title>
        <Dialog.Description>{dialogDescription}</Dialog.Description>
      </Dialog.Header>
      <form class="grid items-start gap-4">
        <div class="grid gap-2">
          <Label for="name">Name</Label>
          <Input
            placeholder="Faculty name"
            type="text"
            id="name"
            bind:value={facultyData.name}
          />
          <p
            class="text-sm font-medium text-red-600 {!errorMessage.name &&
              'hidden'}"
          >
            {errorMessage.name}
          </p>
        </div>
        <Button
          type="submit"
          on:click={onCreateOrUpdate}
          disabled={requestOngoing}
        >
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing
            ? dialogMode == "CREATE"
              ? "Create"
              : "Save"
            : "Please wait"}
        </Button>
      </form>
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Drawer.Root
    closeOnEscape={!requestOngoing}
    closeOnOutsideClick={!requestOngoing}
    onOpenChange={(open) => {
      if (!open) {
        internalClose();
      }
    }}
    bind:open
  >
    <Drawer.Content>
      <Drawer.Header class="text-left">
        <Drawer.Title>{dialogTitle}</Drawer.Title>
        <Drawer.Description>{dialogDescription}</Drawer.Description>
      </Drawer.Header>
      <form class="grid items-start gap-4 px-4">
        <div class="grid gap-2">
          <Label for="name">Name</Label>
          <Input type="text" id="name" bind:value={facultyData.name} />
          <p
            class="text-sm font-medium text-red-600 {!errorMessage.name &&
              'hidden'}"
          >
            {errorMessage.name}
          </p>
        </div>
        <Button
          type="submit"
          on:click={onCreateOrUpdate}
          disabled={requestOngoing}
        >
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing
            ? dialogMode == "CREATE"
              ? "Create"
              : "Save"
            : "Please wait"}
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
