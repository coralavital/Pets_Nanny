class Error{
    constructor(){
        this.flag = false
		this.changeMessage = false;
		this.errorChange = false;
    }
    flagToTrue(){
        this.flag = true
    }
    flagToFalse(){
        this.flag = false
    }

}

module.exports = new Error()