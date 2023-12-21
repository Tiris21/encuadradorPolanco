require('./db/connection')
const devicesModel = require('./db/models/cat_devices')
const consumptionsModel = require('./db/models/consumptions')

const fecha = "22/11/2023" // fecha donde se hace el update de la lectura inicial y final 
const fechaayer = "21/11/2023" // fecha donde toma el valor de la lectura  final y la pone como inicial en la fecha de arriba

const cuadrarMirrow = async () => {
    
    try{
        const devices_pol =  await devicesModel.find({idtypedevice : {$ne : "3"}, idfacility : "1", iddevices: {$regex: '^01.*$'}}).exec();

        let consumoxdia, sumaconsumo = 0, adicional
        let consumptions

        for(let i=0; i<devices_pol.length; i++){
            consumptions = await consumptionsModel.find({id: devices_pol[i].iddevices, fecha: fecha}).exec();

            if(consumptions.length == 2){
                consumoxdia = consumptions[1].value - consumptions[0].value;
            }else if (consumptions.length > 2){
                let inicial, final;
                for(let z=0; z<consumptions.length; z++){
                    if(consumptions[z].hora.startsWith("00")){
                        inicial = consumptions[z].value
                    }
                    if(consumptions[z].hora.startsWith("23")){
                        final = consumptions[z].value
                    }
                }
                
                //console.log("inicial: " + inicial + " final: " + final)
                consumoxdia = final - inicial
            }else{
                consumoxdia = 0
            }

            (consumoxdia < 0) ? consumoxdia*-1 : consumoxdia;
            console.log(devices_pol[i].iddevices + " ->> " + consumoxdia)
            sumaconsumo += consumoxdia
        }

        console.log("total del consumo= " + sumaconsumo)
        sumaconsumo = sumaconsumo * 1.017
        console.log("total del consumo mas el 0.017% = " + sumaconsumo)

        
        // obtener la lectura final de un dia anterior
        const mirrowconsumptionsayer = await consumptionsModel.findOne({id: "010161", fecha: fechaayer, hora: {$regex: '^23.*$'}}).exec();
        const lecturafinal = parseFloat(mirrowconsumptionsayer.value) + parseFloat(sumaconsumo)

        // EJECUTA EL UPDATE A LOS REGISTROS DEL MIRROW 
        await consumptionsModel.updateMany({id: "010161", fecha: fecha, hora: {$regex: '^00.*$'}}, { $set: { value:  mirrowconsumptionsayer.value} }).exec();
        await consumptionsModel.updateMany({id: "010161", fecha: fecha, hora: {$regex: '^23.*$'}}, { $set: { value:  lecturafinal} }).exec();
        console.log('lectura inicial mirrow -> ' + mirrowconsumptionsayer.value)
        console.log('lectura final mirrow-> ' + lecturafinal)
        

    } catch (error) {
        console.log(error)
    }

}  



cuadrarMirrow();