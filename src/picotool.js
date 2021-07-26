class PicoTool {
  constructor(usbDevice) {
    this.usbDevice = usbDevice;
    this.token = 0;
    this.outEndpointNumber = undefined;
    this.inEndpointNumber = undefined;
  }

  async open() {
    await this.usbDevice.open();

    const usbInterfaceNumber =
      this.usbDevice.configuration.interfaces.length == 0 ? 0 : 1;

    const usbInterfaceAlternate = this.usbDevice.configuration.interfaces[
      usbInterfaceNumber
    ].alternates[0];

    if (usbInterfaceAlternate.interfaceClass !== 0xff) {
      throw new Error("Unexpected interfaceClass!");
    }

    this.outEndpointNumber = usbInterfaceAlternate.endpoints[0].endpointNumber;
    this.inEndpointNumber = usbInterfaceAlternate.endpoints[1].endpointNumber;

    await this.usbDevice.claimInterface(usbInterfaceNumber);

    this.token = 1;
  }

  async close() {
    await this.usbDevice.close();
  }

  async exlusiveAccess(bExclusive) {
    const exclusiveCmd = new ArrayBuffer(1);
    const view = new DataView(exclusiveCmd);

    // exclusive_cmd
    view.setUint8(0, bExclusive);

    await this.runCmd(0x01, exclusiveCmd);
  }

  async reboot(dPC, dSP, dDelayMS) {
    const rebootCmd = new ArrayBuffer(12);
    const view = new DataView(rebootCmd);

    // reboot_cmd
    view.setUint32(0, dPC, true); // dPC
    view.setUint32(4, dSP, true); // dSP
    view.setUint32(8, dDelayMS, true); // dDelayMS

    await this.runCmd(0x02, rebootCmd);
  }

  async flashErase(dAddr, dSize) {
    const rangeCmd = new ArrayBuffer(8);
    const view = new DataView(rangeCmd);

    // range_cmd
    view.setUint32(0, dAddr, true); // dAddr
    view.setUint32(4, dSize, true); // dSize

    await this.runCmd(0x03, rangeCmd);
  }

  async read(dAddr, dSize) {
    const rangeCmd = new ArrayBuffer(8);
    const view = new DataView(rangeCmd);

    // range_cmd
    view.setUint32(0, dAddr, true); // dAddr
    view.setUint32(4, dSize, true); // dSize

    return await this.runCmd(0x84, rangeCmd, dSize);
  }

  async write(dAddr, data) {
    const rangeCmd = new ArrayBuffer(8);
    const view = new DataView(rangeCmd);

    // range_cmd
    view.setUint32(0, dAddr, true); // dAddr
    view.setUint32(4, data.byteLength, true); // dSize

    await this.runCmd(0x05, rangeCmd, data);
  }

  async exitXip() {
    await this.runCmd(0x06);
  }

  async runCmd(bCmdId, cmdData, transferLengthOrData) {
    const cmd = new ArrayBuffer(32);
    const view = new DataView(cmd);

    view.setUint32(0, 0x431fd10b, true); // dMagic
    view.setUint32(4, this.token++, true); // dToken
    view.setUint8(8, bCmdId); // bCmdId
    view.setUint8(9, cmdData !== undefined ? cmdData.byteLength : 0); // bCmdSize
    view.setUint16(10, 0x0000, true); // _unused
    if (transferLengthOrData === undefined) {
      view.setUint32(12, 0, true); // dTransferLength
    } else if (typeof transferLengthOrData === "number") {
      view.setUint32(12, transferLengthOrData, true); // dTransferLength
    } else {
      view.setUint32(12, transferLengthOrData.byteLength, true); // dTransferLength
    }

    if (cmdData !== undefined) {
      const cmdDataView = new DataView(cmdData);

      for (var i = 0; i < cmdData.byteLength; i++) {
        view.setUint8(16 + i, cmdDataView.getUint8(i));
      }
    }

    // console.log(new Uint8Array(cmd));

    const transferOutResult = await this.usbDevice.transferOut(
      this.outEndpointNumber,
      cmd
    );

    let transferInResult = undefined;

    if (transferLengthOrData !== undefined) {
      if (bCmdId & 0x80) {
        transferInResult = await this.usbDevice.transferIn(
          this.inEndpointNumber,
          transferLengthOrData
        );
      } else {
        await this.usbDevice.transferOut(
          this.outEndpointNumber,
          transferLengthOrData
        );
      }
    }

    if (bCmdId & 0x80) {
      await this.usbDevice.transferOut(
        this.outEndpointNumber,
        new ArrayBuffer(1)
      );
    } else {
      transferInResult = await this.usbDevice.transferIn(
        this.inEndpointNumber,
        1
      );
    }

    return new Uint8Array(transferInResult.data.buffer);
  }
}
