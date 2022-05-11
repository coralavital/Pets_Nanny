class Error{
    constructor(){
        this.flag = false
    }
    flagToTrue(){
        this.flag = true
    }
    flagToFalse(){
        this.flag = false
    }

}

module.exports = new Error()