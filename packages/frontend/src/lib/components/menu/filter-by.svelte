<script lang="ts">
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import * as Popover from "@/components/ui/popover";
  import { Button } from "@/components/ui/button";
  import { Search } from "lucide-svelte/icons";
  import * as Select from "@/components/ui/select";
  import { mediaQuery } from "svelte-legos";
  import * as Sheet from "@/components/ui/sheet";

  type FilterByScheme =
    | {
        type: "text" | "number";
      }
    | {
        type: "select";
        options: Array<{ label?: string; value: string }> | Array<string>;
      };

  export let onSearch: () => void;
  export let onResetSearch: () => void;
  export let description: string;
  export let filterByValue: { [name: string]: any };
  export let filterByScheme: {
    [name: string]: FilterByScheme & { label?: string };
  } = {};

  function onSelectedChange(key: string, e: any) {
    if (!e) return;

    filterByValue[key] = e.value;
  }

  function internalSearch() {
    onSearch();
    open = false;
  }

  function internalReset() {
    onResetSearch();
    selectInputsValue = {};
    open = false;
  }

  let open = false;
  let selectInputsValue: { [name: string]: any } = {};
  let isDesktop = mediaQuery("(min-width: 768px)");
</script>

{#if $isDesktop}
  <Popover.Root bind:open portal={null}>
    <Popover.Trigger asChild let:builder>
      <Button builders={[builder]} variant="outline" class="gap-1.5 h-10">
        <Search class="h-3.5 w-3.5" />
        <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">Search</span>
      </Button>
    </Popover.Trigger>
    <Popover.Content class="w-80 px-0" align="end">
      <div class="grid">
        <div class="space-y-2 px-4 pb-4 border-b">
          <h4 class="font-medium leading-none">Search</h4>
          <p class="text-sm text-muted-foreground">{description}</p>
        </div>
        <div class="grid p-4 gap-3 overflow-auto max-h-48 sm:max-h-44">
          {#each Object.keys(filterByValue) as key}
            <div class="grid grid-rows-1 sm:grid-cols-3 items-center gap-4">
              {#if filterByScheme[key]}
                <Label for={key} class="capitalize"
                  >{filterByScheme[key].label || key}</Label
                >
                {#if filterByScheme[key].type == "number"}
                  <Input
                    type="number"
                    id={key}
                    bind:value={filterByValue[key]}
                    class="col-span-2 h-8"
                  />
                {:else if filterByScheme[key].type == "select"}
                  <Select.Root
                    loop
                    bind:selected={selectInputsValue[key]}
                    onSelectedChange={(e) => onSelectedChange(key, e)}
                  >
                    <Select.Trigger class="col-span-2 h-8">
                      <Select.Value placeholder="Select" />
                    </Select.Trigger>
                    <Select.Content class="overflow-auto max-h-32">
                      {#each filterByScheme[key].options as option}
                        {#if typeof option == "string"}
                          <Select.Item value={option} label={option} />
                        {:else}
                          <Select.Item
                            value={option.value}
                            label={option.label || option.value}
                          />
                        {/if}
                      {/each}
                    </Select.Content>
                  </Select.Root>
                {:else}
                  <Input
                    id={key}
                    bind:value={filterByValue[key]}
                    class="col-span-2 h-8"
                  />
                {/if}
              {:else}
                <Label for={key} class="capitalize">{key}</Label>
                <Input
                  id={key}
                  bind:value={filterByValue[key]}
                  class="col-span-2 h-8"
                />
              {/if}
            </div>
          {/each}
        </div>
        <div class="flex px-4 flex-row justify-between pt-4 border-t">
          <Button size="sm" on:click={internalReset} variant="outline"
            >Reset</Button
          >
          <Button size="sm" on:click={internalSearch}>Search</Button>
        </div>
      </div>
    </Popover.Content>
  </Popover.Root>
{:else}
  <Sheet.Root bind:open>
    <Sheet.Trigger asChild let:builder>
      <Button builders={[builder]} variant="outline" class="gap-1.5 h-10">
        <Search class="h-3.5 w-3.5" />
        <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">Search</span>
      </Button>
    </Sheet.Trigger>
    <Sheet.Content side="right" class="overflow-auto">
      <Sheet.Header>
        <Sheet.Title>Search</Sheet.Title>
        <Sheet.Description>{description}</Sheet.Description>
      </Sheet.Header>
      <form class="grid items-start gap-4 mt-4">
        {#each Object.keys(filterByValue) as key}
          <div class="grid gap-2">
            {#if filterByScheme[key]}
              <Label for={key} class="capitalize"
                >{filterByScheme[key].label || key}</Label
              >
              {#if filterByScheme[key].type == "number"}
                <Input id={key} type="number" bind:value={filterByValue[key]} />
              {:else if filterByScheme[key].type == "select"}
                <Select.Root
                  loop
                  bind:selected={selectInputsValue[key]}
                  onSelectedChange={(e) => onSelectedChange(key, e)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select" />
                  </Select.Trigger>
                  <Select.Content class="overflow-auto max-h-32">
                    {#each filterByScheme[key].options as option}
                      {#if typeof option == "string"}
                        <Select.Item value={option} label={option} />
                      {:else}
                        <Select.Item
                          value={option.value}
                          label={option.label || option.value}
                        />
                      {/if}
                    {/each}
                  </Select.Content>
                </Select.Root>
              {:else}
                <Input id={key} bind:value={filterByValue[key]} />
              {/if}
            {:else}
              <Label for={key} class="capitalize">{key}</Label>
              <Input id={key} bind:value={filterByValue[key]} />
            {/if}
          </div>
        {/each}

        <div class="flex flex-row justify-between">
          <Button size="sm" on:click={internalReset} variant="outline"
            >Reset</Button
          >
          <Button size="sm" on:click={internalSearch}>Search</Button>
        </div>
      </form>
    </Sheet.Content>
  </Sheet.Root>
{/if}
