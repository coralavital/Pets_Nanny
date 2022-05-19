class sFilter {
	constructor(date, to, from, typeP, typeS, area_city, price){
		this.date = date,
		this.from = from,
		this.to = to,
		this.typeP = typeP,
		this.typeS = typeS,
		this.area_city = area_city,
		this.price = price
	}
}


module.exports = new sFilter()