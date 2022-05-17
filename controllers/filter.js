const firebase = require('../firebase');
const areaCities = require('./areaCities');

class Filter{
    constructor(){;
        this.providers = this.GetProviderFromFirebase();
        this.result = null;
        this.flag = true;
    }

    async GetProviderFromFirebase(){
        const prov = await firebase.GetProviders()
        return prov
    }

    fixParams(area_city,typeP,typeS){
        //all the selected checkboxes from the dropdown will be in dict data type
        // let type_of_service = {take_for_walk: (typeP != null && typeP.includes('take_for_walk'))?1:0, 
        // keep_at_home: (typeP != null && typeP.includes('keep_at_home'))?1:0};

        // let type_of_pet = {type_dog: (typeS != null && typeS.includes('type_dog'))?1:0,
        // type_cat: (typeS != null && typeS.includes('type_cat'))?1:0,
        // type_other: (typeS != null && typeS.includes('type_other'))?1:0};

        // putting area_city into array named -> ar
        if(area_city == null){
          // need to add all the cities ! 
          area_city = areaCities.area.concat(areaCities.city)
        }
        if(typeP == null){
          typeP = ["Dog", "Cat", "Other pet"]
        }
        if (typeS == null){
          typeS = ["Take for a walk", "Keep at home"]
        }
        var ar = this.toArray(area_city)
        typeP = this.toArray(typeP)
        typeS = this.toArray(typeS)
        return [ar, typeP, typeS]
    }
    async changeProvider(ar, price, type_of_pet, type_of_service, callback){
        this.flag=false
        this.result = await firebase.filtering(ar, price, type_of_pet, type_of_service)
		callback();
    }
    
    toArray(tmp){
      if(!Array.isArray(tmp)){
        var ar=[String(tmp)];
      }
      else{
        var ar = tmp;
      }
      return ar
    }
}



module.exports = new Filter()