/*
 * Copyright (c) 2021 Arm Limited and Contributors. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 */

/* globals PicoTool */

async function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", event => {
      resolve(event.target.result);
    });

    reader.readAsArrayBuffer(file);
  });
}

document.querySelector("#file").onchange = async event => {
  const statusDiv = document.getElementById("status");

  statusDiv.innerHTML = "";

  try {
    const files = event.target.files;

    if (files.length === 0) {
      return;
    }

    if (!("usb" in navigator)) {
      throw new Error("Oh no! Your browser does not support WebUSB!");
    }

    statusDiv.innerHTML += "requesting device ... <br/>";
    const usbDevice = await PicoTool.requestDevice();

    const fileData = await readFile(files[0]);
    const writeData = new ArrayBuffer(PicoTool.FLASH_SECTOR_ERASE_SIZE);

    const srcDataView = new DataView(fileData);
    const dstDataView = new DataView(writeData);

    const picoTool = new PicoTool(usbDevice);

    statusDiv.innerHTML += "opening device ... <br/>";
    await picoTool.open();

    statusDiv.innerHTML += "reset ... <br/>";
    await picoTool.reset();

    statusDiv.innerHTML += "exlusive access device ... <br/>";
    await picoTool.exlusiveAccess(1);

    statusDiv.innerHTML += "exit xip ... <br/>";
    await picoTool.exitXip();

    for (
      let i = 0;
      i < fileData.byteLength;
      i += PicoTool.FLASH_SECTOR_ERASE_SIZE
    ) {
      let j = 0;
      for (
        j = 0;
        j < PicoTool.FLASH_SECTOR_ERASE_SIZE && i + j < fileData.byteLength;
        j++
      ) {
        dstDataView.setUint8(j, srcDataView.getUint8(i + j));
      }

      statusDiv.innerHTML += "erasing ... ";
      await picoTool.flashErase(
        PicoTool.FLASH_START + i,
        PicoTool.FLASH_SECTOR_ERASE_SIZE
      );

      statusDiv.innerHTML += "writing ... ";
      await picoTool.write(PicoTool.FLASH_START + i, writeData);

      statusDiv.innerHTML +=
        " " + (((i + j) * 100) / fileData.byteLength).toFixed(2) + "% <br/>";
    }

    statusDiv.innerHTML += "rebooting device ... <br/>";
    await picoTool.reboot(0, PicoTool.SRAM_END, 512);

    statusDiv.innerHTML += "closing device ... <br/>";
    await picoTool.close();
  } catch (e) {
    statusDiv.innerHTML = "Error: " + e.message;
  } finally {
    document.querySelector("#file").value = null;
  }
};
