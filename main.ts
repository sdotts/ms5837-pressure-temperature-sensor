// Port of MS5837 Arduinio Library From Blue Robotics To MakeCode


/**
 * MS5837 block
 */
//% weight=100 color=#70c0f0 icon="\uf773" block="MS5837"
namespace MS5837 {
    //Addresses and commands
    const MS5837_I2C_ADDR = 0x76;
    const MS5837_RESET_CMD = 0x1E;
    const MS5837_ADC_READ = 0x00;
    const MS5837_PROM_READ = 0xA0;
    const MS5837_CONVERT_D1_8192 = 0x4A;
    const MS5837_CONVERT_D2_8192 = 0x5A;

    //Sensor Models
    enum SENS_MODEL {
        //% block="02BA"
        MOD_02BA = 0x0,
        //% block="30BA"
        MOD_30BA = 0x1
    }

    //Common Densities
    enum waterDensity {
        //% block="Fresh Water"
        FRESH = 997,
        //% block="Salt Water"
        SALT = 1029
    }

    //Defualt Values and Variables
    let fluidDensity = waterDensity.FRESH; //kg/m^3 for fresh water at 25C
    let SENSOR_MODEL = SENS_MODEL.MOD_02BA; //Set Defualt Model
    let PROM: number[] = []     //Prom Calibration


    function reset(): void {
        pins.i2cWriteNumber(MS5837_I2C_ADDR, MS5837_RESET_CMD, NumberFormat.UInt8BE)
    }

    function crc4(prom: number[]): number {
        let nRem = 0
        let nProm = prom.slice(0)
        nProm[0] = nProm[0] & 0x0FFF
        nProm[7] = 0

        for (let i = 0; i < 16; i++) {
            if (i % 2 == 1) {
                nRem ^= nProm[i >> 1] & 0x00FF
            } else {
                nRem ^= nProm[i >> 1] >> 8
            }
            for (let nBit = 8; nBit > 0; nBit--) {
                if (nRem & 0x8000) {
                    nRem = (nRem << 1) ^ 0x3000
                } else {
                    nRem = nRem << 1
                }
            }
        }

        nRem = (nRem >> 12) & 0x000F
        return nRem
    }


    function read_PROM(): void {
        PROM = []
        for (let i = 0; i < 7; i++) {
            pins.i2cWriteNumber(MS5837_I2C_ADDR, MS5837_PROM_READ + i * 2, NumberFormat.UInt8BE)
            let value = pins.i2cReadNumber(MS5837_I2C_ADDR, NumberFormat.UInt16BE)
            PROM.push(value)
        }
        let crccalc = crc4(PROM)
        if (crccalc != (PROM[0] >> 12)) {
            control.panic(55) //CRC Error
        }
    }

    /**
     * Initialize sensor
     */
    //% block="initialize MS5837"
    export function init(): void {
        reset()
        basic.pause(10)
        read_PROM()
    }

    /**
     * set sensor model
     */
    //% blockId="MS5837_SET_MODEL" block="set address %model"
    //% weight=50 blockGap=8
    export function model(model: SENS_MODEL) {
        SENSOR_MODEL = model
    }

}
