# JavaScript port of picotool

JavaScript port of [picotool](https://github.com/raspberrypi/picotool).

This library allows you to interact with a [Raspberry Pi Pico](https://www.raspberrypi.org/products/raspberry-pi-pico/) or any [RP2040](https://www.raspberrypi.org/products/rp2040/) based board using JavaScript and a [WebUSB](https://wicg.github.io/webusb/) enabled web browser, when the board is in in BOOTSEL mode.

## Examples

 | Name | Description | Links |
 | ---- | ----------- | ----- |
 | Flash Binary | Flash a `.bin` to the board in the browser | [[demo]](https://armdeveloperecosystem.github.io/picotool.js/examples/flash_binary/) [[src]](examples/flash_binary)
 
 ## OS Specific Setup
 
 ## Linux
 
In order use this library with WebUSB on Linux, udev rules will need to be configured. Without doing this you will get an "Access denied" error.

1. Create a file named `/etc/udev/rules.d/60-rp2040.rules` as root or with sudo, which contains the following:
```
SUBSYSTEMS=="usb", ATTRS{idVendor}=="2e8a", MODE:="0666"
```
2. Run `sudo udevadm trigger`
3. Run `sudo udevadm control --reload-rules`
4. If the board was plug in previously, unplug and plug it back in.
 
### Windows

In order use this library WebUSB on Windows the WinUSB driver must be installed.

1. Download [Zadig](https://github.com/pbatard/libwdi/releases/download/b755/zadig-2.6.exe)
1. Put board into USB boot ROM mode, by holding down Boot or BOOTSEL button while plugging in USB cable.
1. Open Zadig
1. In drop-down, ensure "RP2 Boot (Interface 1)" is selected.
1. Click "Install Driver" button.
1. WinUSB driver is installed.


## License

[Apache-2.0 License](LICENSE)

---

Disclaimer: This is not an official Arm product.
