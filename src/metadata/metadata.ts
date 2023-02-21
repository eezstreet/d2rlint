import { Workspace } from "../lib/workspace.ts";

function WriteMetadataHeader(): string {
  return `<?xml version="1.0" encoding="utf-8"?>`;
}

function WriteMetadataUniqueWeapons(ws: Workspace): string {
  const { uniqueItems, weapons } = ws;
  if (!uniqueItems || !weapons) {
    return "";
  }

  const weaponTypeMap: {
    [key: string]: { index: number; name: string; lvl: number }[];
  } = {};
  uniqueItems.forEach((unique, index) => {
    // if it's not a weapon, skip
    const found = weapons.find((weap) =>
      weap.code === unique.code && weap.code !== ""
    );
    if (!found) {
      return;
    }

    const name = unique.index as string;
    const lvl = Number.parseInt(unique.lvl as string);

    if (weaponTypeMap[found.type as string] !== undefined) {
      weaponTypeMap[found.type as string].push({ index, name, lvl });
    } else {
      weaponTypeMap[found.type as string] = [{ index, name, lvl }];
    }
  });

  const keys = Object.keys(weaponTypeMap);
  const groups = keys.map((k) => {
    const group = weaponTypeMap[k].sort((a, b) => a.lvl - b.lvl).map((itm) =>
      `    <Item Index="${itm.index}" Name="${itm.name}" Lvl="${itm.lvl}" />`
    ).join("\n");
    return `  <Group Index="${k}">\n${group}\n  </Group>`;
  }).join("\n");

  return `<Group Name="Unique-Weapon">\n${groups}\n</Group>`;
}

function WriteMetadataUniqueArmor(ws: Workspace): string {
  const { uniqueItems, armor } = ws;
  if (!uniqueItems || !armor) {
    return "";
  }

  const weaponTypeMap: {
    [key: string]: { index: number; name: string; lvl: number }[];
  } = {};
  uniqueItems.forEach((unique, index) => {
    // if it's not a weapon, skip
    const found = armor.find((weap) =>
      weap.code === unique.code && weap.code !== ""
    );
    if (!found) {
      return;
    }

    const name = unique.index as string;
    const lvl = Number.parseInt(unique.lvl as string);

    if (weaponTypeMap[found.type as string] !== undefined) {
      weaponTypeMap[found.type as string].push({ index, name, lvl });
    } else {
      weaponTypeMap[found.type as string] = [{ index, name, lvl }];
    }
  });

  const keys = Object.keys(weaponTypeMap);
  const groups = keys.map((k) => {
    const group = weaponTypeMap[k].sort((a, b) => a.lvl - b.lvl).map((itm) =>
      `    <Item Index="${itm.index}" Name="${itm.name}" Lvl="${itm.lvl}" />`
    ).join("\n");
    return `  <Group Index="${k}">\n${group}\n  </Group>`;
  }).join("\n");

  return `<Group Name="Unique-Armor">\n${groups}\n</Group>`;
}

function WriteMetadataUniqueMisc(ws: Workspace): string {
  const { uniqueItems, misc } = ws;
  if (!uniqueItems || !misc) {
    return "";
  }

  const weaponTypeMap: {
    [key: string]: { index: number; name: string; lvl: number }[];
  } = {};
  uniqueItems.forEach((unique, index) => {
    // if it's not a weapon, skip
    const found = misc.find((weap) =>
      weap.code === unique.code && weap.code !== ""
    );
    if (!found) {
      return;
    }

    const name = unique.index as string;
    const lvl = Number.parseInt(unique.lvl as string);

    if (weaponTypeMap[found.type as string] !== undefined) {
      weaponTypeMap[found.type as string].push({ index, name, lvl });
    } else {
      weaponTypeMap[found.type as string] = [{ index, name, lvl }];
    }
  });

  const keys = Object.keys(weaponTypeMap);
  const groups = keys.map((k) => {
    const group = weaponTypeMap[k].sort((a, b) => a.lvl - b.lvl).map((itm) =>
      `    <Item Index="${itm.index}" Name="${itm.name}" Lvl="${itm.lvl}" />`
    ).join("\n");
    return `  <Group Index="${k}">\n${group}\n  </Group>`;
  }).join("\n");

  return `<Group Name="Unique-Misc">\n${groups}\n</Group>`;
}

function WriteMetadataSetWeapons(ws: Workspace): string {
  const { setItems, weapons } = ws;
  if (!setItems || !weapons) {
    return "";
  }

  const weaponTypeMap: {
    [key: string]: { index: number; name: string; lvl: number }[];
  } = {};

  setItems.forEach((unique, index) => {
    // if it's not a weapon, skip
    const found = weapons.find((weap) =>
      weap.code === unique.item && weap.code !== ""
    );
    if (!found) {
      return;
    }

    const name = unique.index as string;
    const lvl = Number.parseInt(unique.lvl as string);

    if (weaponTypeMap[found.type as string] !== undefined) {
      weaponTypeMap[found.type as string].push({ index, name, lvl });
    } else {
      weaponTypeMap[found.type as string] = [{ index, name, lvl }];
    }
  });

  const keys = Object.keys(weaponTypeMap);
  const groups = keys.map((k) => {
    const group = weaponTypeMap[k].sort((a, b) => a.lvl - b.lvl).map((itm) =>
      `    <Item Index="${itm.index}" Name="${itm.name}" Lvl="${itm.lvl}" />`
    ).join("\n");
    return `  <Group Index="${k}">\n${group}\n  </Group>`;
  }).join("\n");

  return `<Group Name="Set-Weapon">\n${groups}\n</Group>`;
}

function WriteMetadataSetArmor(ws: Workspace): string {
  const { setItems, armor } = ws;
  if (!setItems || !armor) {
    return "";
  }

  const weaponTypeMap: {
    [key: string]: { index: number; name: string; lvl: number }[];
  } = {};
  setItems.forEach((unique, index) => {
    // if it's not a weapon, skip
    const found = armor.find((weap) =>
      weap.code === unique.item && weap.code !== ""
    );
    if (!found) {
      return;
    }

    const name = unique.index as string;
    const lvl = Number.parseInt(unique.lvl as string);

    if (weaponTypeMap[found.type as string] !== undefined) {
      weaponTypeMap[found.type as string].push({ index, name, lvl });
    } else {
      weaponTypeMap[found.type as string] = [{ index, name, lvl }];
    }
  });

  const keys = Object.keys(weaponTypeMap);
  const groups = keys.map((k) => {
    const group = weaponTypeMap[k].sort((a, b) => a.lvl - b.lvl).map((itm) =>
      `    <Item Index="${itm.index}" Name="${itm.name}" Lvl="${itm.lvl}" />`
    ).join("\n");
    return `  <Group Index="${k}">\n${group}\n  </Group>`;
  }).join("\n");

  return `<Group Name="Set-Armor">\n${groups}\n</Group>`;
}

function WriteMetadataSetMisc(ws: Workspace): string {
  const { setItems, misc } = ws;
  if (!setItems || !misc) {
    return "";
  }

  const weaponTypeMap: {
    [key: string]: { index: number; name: string; lvl: number }[];
  } = {};
  setItems.forEach((unique, index) => {
    // if it's not a weapon, skip
    const found = misc.find((weap) =>
      weap.code === unique.item && weap.code !== ""
    );
    if (!found) {
      return;
    }

    const name = unique.index as string;
    const lvl = Number.parseInt(unique.lvl as string);

    if (weaponTypeMap[found.type as string] !== undefined) {
      weaponTypeMap[found.type as string].push({ index, name, lvl });
    } else {
      weaponTypeMap[found.type as string] = [{ index, name, lvl }];
    }
  });

  const keys = Object.keys(weaponTypeMap);
  const groups = keys.map((k) => {
    const group = weaponTypeMap[k].sort((a, b) => a.lvl - b.lvl).map((itm) =>
      `    <Item Index="${itm.index}" Name="${itm.name}" Lvl="${itm.lvl}" />`
    ).join("\n");
    return `  <Group Index="${k}">\n${group}\n  </Group>`;
  }).join("\n");

  return `<Group Name="Set-Misc">\n${groups}\n</Group>`;
}

export function GenerateMetadata(ws: Workspace) {
  const outputSections = [
    WriteMetadataHeader(),
    WriteMetadataUniqueWeapons(ws),
    WriteMetadataUniqueArmor(ws),
    WriteMetadataUniqueMisc(ws),
    WriteMetadataSetWeapons(ws),
    WriteMetadataSetArmor(ws),
    WriteMetadataSetMisc(ws),
  ].join("\n");
  Deno.writeTextFileSync("metadata.xml", outputSections);
}
