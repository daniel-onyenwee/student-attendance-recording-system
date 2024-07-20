<script lang="ts">
  import { mediaQuery } from "svelte-legos";
  import { LoaderCircle, ChevronsUpDown, Check } from "lucide-svelte/icons";
  import { showDialogToast } from "@/utils";
  import * as Command from "@/components/ui/command";
  import * as Popover from "@/components/ui/popover";
  import {
    createDepartment,
    updateDepartment,
    getFaculties,
    type FacultyModel,
    type DepartmentModel,
  } from "@/service";
  import { cn } from "@/utils.js";
  import * as Dialog from "@/components/ui/dialog";
  import * as Drawer from "@/components/ui/drawer";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher, tick } from "svelte";
  import { Label } from "@/components/ui/label";
  import { Input } from "@/components/ui/input";

  export let accessToken: string;

  function show(mode: "CREATE", data: undefined): void;
  function show(mode: "UPDATE", data: DepartmentModel): void;
  export function show(mode: "CREATE" | "UPDATE", data: any) {
    dialogMode = mode;
    if (mode == "UPDATE") {
      departmentData = structuredClone(data);
    }
    open = true;
    getFaculties({ accessToken, count: "all" })
      .then(({ data }) => {
        faculties = data || [];
      })
      .finally(() => {
        facultiesLoaded = true;
      });
  }

  export function close() {
    internalClose();
    open = false;
    facultiesLoaded = false;
  }

  function internalClose() {
    errorMessage = {};
    departmentData = {};
  }

  function convertNumToLevels(levelNum: number): string {
    if (levelNum == 1) {
      return "Only 100L";
    } else {
      return `100L - ${levelNum * 100}L`;
    }
  }

  function onLevelsSelected(currentValue: string) {
    departmentData.levels = [];
    for (let i = 0; i < parseInt(currentValue) + 1; i++) {
      departmentData.levels.push(`L_${(1 + i) * 100}` as any);
    }
    departmentData.levels = departmentData.levels;
    levelsPopoverOpen = false;
  }

  function closeAndFocusTrigger(triggerId: string) {
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  async function onCreateOrUpdate() {
    requestOngoing = true;

    errorMessage = {};

    if (!departmentData.name) {
      errorMessage.name = "Field required";
      requestOngoing = false;
      return;
    }

    if (!departmentData.faculty) {
      errorMessage.faculty = "Field required";
      requestOngoing = false;
      return;
    }

    if (!departmentData.levels) {
      errorMessage.levels = "Field required";
      requestOngoing = false;
      return;
    }

    try {
      let serviceRequest = null;

      if (dialogMode == "CREATE") {
        serviceRequest = await createDepartment({
          accessToken: accessToken,
          name: departmentData.name as string,
          levels: departmentData.levels,
          facultyId: departmentData.facultyId as string,
        });
      } else {
        serviceRequest = await updateDepartment({
          accessToken: accessToken,
          id: departmentData.id as string,
          name: departmentData.name as string,
          levels: departmentData.levels,
          facultyId: departmentData.facultyId as string,
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
        } else if (serviceRequest.error.code == 3002) {
          errorMessage.faculty = serviceRequest.error.message;
        } else if (serviceRequest.error.code == 3005) {
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
  let errorMessage: Partial<Record<keyof DepartmentModel, string>> = {};
  let departmentData: Partial<DepartmentModel & { facultyId: string }> = {};
  let open = false;
  let levelsPopoverOpen = false;
  let facultyPopoverOpen = false;
  let facultiesLoaded = false;
  let faculties: FacultyModel[] = [];
  let dialogMode: "CREATE" | "UPDATE" = "CREATE";
  let isDesktop = mediaQuery("(min-width: 768px)");
  let dispatch = createEventDispatcher();

  $: dialogTitle = `${dialogMode == "CREATE" ? "Create" : "Edit"} department`;
  $: dialogDescription = `${
    dialogMode == "CREATE"
      ? "Create a new department here. Click create when you're done."
      : "Make changes to the department here. Click save when you're done."
  }`;
  $: selectedLevels = departmentData.levels
    ? convertNumToLevels((departmentData.levels || []).length)
    : undefined;
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
            placeholder="Department name"
            type="text"
            id="name"
            bind:value={departmentData.name}
          />
          <p
            class="text-sm font-medium text-red-600 {!errorMessage.name &&
              'hidden'}"
          >
            {errorMessage.name}
          </p>
        </div>
        <div class="grid gap-2">
          <Label for="name">Faculty</Label>
          <Popover.Root bind:open={facultyPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={facultyPopoverOpen}
                class="w-full justify-between font-normal {departmentData.faculty ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if departmentData.faculty}
                  {departmentData.faculty}
                {:else}
                  Select faculty
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
              <Command.Root loop>
                <Command.Input placeholder="Search faculty..." />
                <Command.List>
                  {#if facultiesLoaded}
                    <Command.Empty>No faculty found.</Command.Empty>
                    <Command.Group>
                      {#each faculties as faculty}
                        <Command.Item
                          onSelect={(currentValue) => {
                            departmentData.facultyId = faculty.id;
                            departmentData.faculty = currentValue;
                            facultyPopoverOpen = false;
                            closeAndFocusTrigger(ids.trigger);
                          }}
                          value={faculty.name}
                        >
                          <Check
                            class={cn(
                              "mr-2 h-4 w-4",
                              departmentData.faculty !== faculty.name &&
                                "text-transparent"
                            )}
                          />
                          {faculty.name}
                        </Command.Item>
                      {/each}
                    </Command.Group>
                  {:else}
                    <Command.Loading class="py-6 text-center text-sm">
                      Loading faculties..
                    </Command.Loading>
                  {/if}
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-600 {!errorMessage.faculty &&
              'hidden'}"
          >
            {errorMessage.faculty}
          </p>
        </div>
        <div class="grid gap-2">
          <Label for="name">Levels</Label>
          <Popover.Root bind:open={levelsPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={levelsPopoverOpen}
                class="w-full justify-between font-normal {selectedLevels ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if selectedLevels}
                  {selectedLevels}
                {:else}
                  Select levels
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
              <Command.Root loop>
                <Command.Input placeholder="Search levels..." />
                <Command.List>
                  <Command.Empty>No levels found.</Command.Empty>
                  <Command.Group>
                    {#each { length: 10 } as _, i}
                      <Command.Item
                        onSelect={() => {
                          onLevelsSelected(i.toString());
                          closeAndFocusTrigger(ids.trigger);
                        }}
                        value={convertNumToLevels(i + 1)}
                      >
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            selectedLevels !== convertNumToLevels(i + 1) &&
                              "text-transparent"
                          )}
                        />
                        {convertNumToLevels(i + 1)}
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-600 {!errorMessage.levels &&
              'hidden'}"
          >
            {errorMessage.levels}
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
          <Input type="text" id="name" bind:value={departmentData.name} />
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
