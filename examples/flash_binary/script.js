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
    const files = event.target.files;
  
    if (files.length === 0) {
      return;
    }
  
    const fileData = await readFile(files[0]);
  
    const eraseSize =
      Math.ceil(fileData.byteLength / PicoTool.FLASH_SECTOR_ERASE_SIZE) *
      PicoTool.FLASH_SECTOR_ERASE_SIZE;
  
    const writeSize =
      Math.ceil(fileData.byteLength / PicoTool.PAGE_SIZE) * PicoTool.PAGE_SIZE;
  
    const writeData = new ArrayBuffer(writeSize);
  
    const srcDataView = new DataView(fileData);
    const dstDataView = new DataView(writeData);
  
    for (let i = 0; i < fileData.byteLength; i++) {
      dstDataView.setUint8(i, srcDataView.getUint8(i));
    }
  
    console.log("requesting device ...");
    const usbDevice = await PicoTool.requestDevice();
  
    const picoTool = new PicoTool(usbDevice);
  
    console.log("opening device ...");
    await picoTool.open();
  
    console.log("reset ...");
    await picoTool.reset();
  
    console.log("exlusive access device ...");
    await picoTool.exlusiveAccess(1);
  
    console.log("exit xip");
    await picoTool.exitXip();
  
    console.log("erase");
    await picoTool.flashErase(PicoTool.FLASH_START, eraseSize);
  
    console.log("write");
    await picoTool.write(PicoTool.FLASH_START, writeData);
  
    //     console.log("read");
    //     console.log(await picoTool.read(PicoTool.FLASH_START, writeSize));
  
    console.log("rebooting device ...");
    await picoTool.reboot(0, PicoTool.SRAM_END, 512);
  
    console.log("closing device ...");
    await picoTool.close();
};
