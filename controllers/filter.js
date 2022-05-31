const firebase = require('../firebase');
const areaCities = require('./areaCities');

class Filter{
    constructor() {
        this.providers = this.GetProviderFromFirebase();
        this.result = null;
        this.flag = true;
    }

    async GetProviderFromFirebase() {
        const prov = await firebase.GetProviders()
        return prov
    }

    fixParams(area_city,typeP,typeS) {
        // putting area_city into array named -> ar
        if(area_city == null) {
          // need to add all the cities ! 
          area_city = areaCities.area_city
        } 
        if(typeP == null) {
          typeP = ["Dog", "Cat", "Other pet"]
        }
        if (typeS == null) {
          typeS = ["Take for a walk", "Keep at home"]
        }
        var ar = this.toArray(area_city)
        typeP = this.toArray(typeP)
        typeS = this.toArray(typeS)
        return [ar, typeP, typeS]
    }
    async changeProvider(ar, price, type_of_pet, type_of_service ,date, from, to, callback) {
        this.flag=false
        from = from.concat(":00")
        to = to.concat(":00")
        const sdate = date.concat("T", from)
        const start = +new Date(sdate)
        const edate = date.concat("T", to)
        const end =+ new Date(edate)

        this.result = await firebase.filtering(ar, price, type_of_pet, type_of_service, start, end)
		callback();
    }
    
    toArray(tmp) {
      if(!Array.isArray(tmp)) {
        var ar=[String(tmp)];
      }
      else{
        var ar = tmp;
      }
      return ar
    }
}



module.exports = new Filter()