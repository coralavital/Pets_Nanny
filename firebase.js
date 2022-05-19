const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, deleteUser, sendPasswordResetEmail  } = require("firebase/auth");
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, deleteDoc, arrayUnion } = require('firebase/firestore');
const { use } = require("chai");
const { async } = require('@firebase/util');

function containsAny(source,target)
{
    var result = source.filter(function(item){ return target.indexOf(item) > -1});   
    return (result.length > 0);  
}

class Firebase {
  constructor() {
    this.config = {
      apiKey: "AIzaSyDRiZLhRsj08msE0VMoKOmnuLoTZPTTS3c",
      authDomain: "pets-nanny.firebaseapp.com",
      databaseURL: "https://pets-nanny-default-rtdb.firebaseio.com",
      projectId: "pets-nanny",
      storageBucket: "pets-nanny.appspot.com",
      messagingSenderId: "304619016592",
      appId: "1:304619016592:web:456c2bcf11dab75437e315",
      measurementId: "G-HLCCC1243J"
    };


    this.app = initializeApp(this.config);

    // // make auth and firestore references
    this.auth = getAuth();
    this.db = getFirestore(this.app);

  }

  authenticate(email, password, callback) {
    signInWithEmailAndPassword(this.auth, email, password).then((cred) => {
      callback();
    });
  }
  //
  async signup(email, password, fullname, phone, type, callback, callbackErr) {
    createUserWithEmailAndPassword(this.auth, email, password).then(async (cred) => {
      const coll = collection(this.db, 'users');

      try {
        const user = doc(this.db, 'users', email)
        const result = await setDoc(user, {
          fullname: fullname,
          phonenumber: phone,
          typeOfUser: type
        });
        callback();
      } catch (error) {
        console.log(email);
        console.log(error);
      }

    });

  }

  async logout(callback) {
  await signOut(this.auth).then((cred) => {
    console.log("Sign-out successful.")
    callback();
    });
  }

  //get currenct user firebase data
  async CurrentUserData(){
    const docRef = doc(this.db, 'users', this.auth._currentUser.email);
    const docSnap = await getDoc(docRef);
    return docSnap.data();
  }

  // updating provider details from personal info after sign up
  async UpdateDocProvider(age, area_city, price_per_hour, type_of_service, type_of_pet, about_me, callback){
    const docRef = doc(this.db, 'users', this.auth._currentUser.email);
    console.log(`updating...  ${this.auth._currentUser.email}`)
    await updateDoc(docRef, {
      age: age,
      area_city: area_city,
      price_per_hour: price_per_hour,
      type_of_service: type_of_service,
      type_of_pet: type_of_pet,
      about_me: about_me,
	  email: this.auth._currentUser.email,
    });
    callback();
  }
   // updating client details from personal info after sign up
   async UpdateDocClient(age, address, about_me, callback){
    const docRef = doc(this.db, 'users', this.auth._currentUser.email);
    console.log(`updating...  ${this.auth._currentUser.email}`)
    await updateDoc(docRef, {
      age: age,
      address: address,
      about_me: about_me
    });
    callback();
   }

   // cheching if user is logged in
  IfLoggedin(){
    if(this.auth._currentUser == null){
      return false
    }
    // maybe user need to be const
    let user = this.auth._currentUser;
    onAuthStateChanged(this.auth, () => {
      if (user) {
        console.log(`user is logged in`)
        return true
      } else {
        console.log(`user is NOT logged in`)
        return false
      }
    });
  }

// for filttring table after search
async filtering(ar,price,typeP,typeS ,start, end) {
	var providersResult =[];
	var i; 

	const coll = query(collection(this.db, 'users'), 
	 where("type_of_pet", "array-contains-any", typeP),
	 );
	const querySnapshot =  await getDocs(coll);
	let result=[];
	querySnapshot.forEach((doc) => {
	  result.push(doc.data())
	
	});
  
	for ( i=0 ; i< result.length; i++){
	  if(result[i].price_per_hour <= price ) {
		  if(containsAny(result[i].area_city ,ar)) {
		    if(containsAny(result[i].type_of_service ,typeS)){
         if(result[i].freeTime != undefined ){
           for(var j=0; j<result[i].freeTime.length; j++){
              if(start >= result[i].freeTime[j].start && end <= result[i].freeTime[j].end){
                  providersResult.push(result[i]);
              }
          }
        }
	  	}
	  }
	}
	
  }
  result = providersResult 
	return result;
}


  // Get all documents in a collection
    async GetAllDataOnce(){

      const querySnapshot = await getDocs(collection(this.db, "users"));
      var users = [];
        querySnapshot.forEach((doc) => {
          // doc.data() is never undefined for query doc snapshots
        // console.log(doc.id, " => ", doc.data());
          users.push(doc.data());
        });
        return users;
    }

  // Get all the documents of the providers only
    async GetProviders(){
      const coll = query(collection(this.db, 'users'),where("typeOfUser", "=="  ,"1"));
      let provider = [];
      const querySnapshot =  await getDocs(coll);
      querySnapshot.forEach((doc) => {
        provider.push(doc.data());
      
      });
      return provider;
    }
    
	//update password
	async changePassword(cpassword, npassword){
		if(cpassword == this.auth._currentUser.password) {
			updatePassword(this.auth._currentUser, npassword).then(() => {
				console.log("updates password");
			}).catch((error ) => {
				console.log("Eror")
			})
			
		}
		else {
			console.log("incorrect password")
		}

	}

	//delete account
	async deleteAccount() {
		deleteDoc(doc(this.db, "users", this.auth._currentUser.email));
		deleteUser(this.auth._currentUser).then(async() => {
			console.log("deleted user");
		}).catch((error ) => {
			console.log("Eror")
		})

	}
	
	//update provider document
	async addFreeTime(date, from, to, callback) {
		const userRef = doc(this.db, "users", this.auth._currentUser.email);
		from = from.concat(":00")
		to = to.concat(":00")
		const sdate = date.concat("T", from)
		const start = +new Date(sdate)
		const edate = date.concat("T", to)
		const end = +new Date(edate)
		const userData = await this.CurrentUserData()

		await EnterTime({start, end});


		async function EnterTime({start, end}){
			let freeTimeObj = {start, end, title: "Free Time"};
			const freeTime = userData.freeTime !== undefined ? userData.freeTime :[];
			freeTime.push(freeTimeObj);
			await updateDoc(userRef, {
				freeTime
			});

		}
		callback()
	}

	async sendEmail(email, callback) {
		await sendPasswordResetEmail(this.auth, email).then(() => {
			callback();
			console.log("sent reset password to you email!")

		}).catch((e) => {
			console.log(e)
		})
	}

	//saving reservations details
	async addReservation(date, from, to, providerEmail, callback) {
		const clientRef = doc(this.db, "users", this.auth._currentUser.email);
		const providerRef = doc(this.db, "users", providerEmail.email);
		from = from.concat(":00")
		to = to.concat(":00")
		const sdate = date.concat("T", from)
		const start = +new Date(sdate)
		const edate = date.concat("T", to)
		const end = +new Date(edate)
		const userData = await this.CurrentUserData()

		await EnterTime({start, end});


		async function EnterTime({start, end}){
			let reservationObj = {start, end, title: "Reservation"};
			const reservations = userData.reservations !== undefined ? userData.reservations :[];
			reservations.push(reservationObj);
      
			await updateDoc(clientRef, {
				reservations
			});
			await updateDoc(providerRef, {
				reservations
			});

		}
		callback()

	};

	//saving contact message details
	async addContactMsg(name, emailSend, messageText, callback) {
		try {
			const date = Date.now();
			const user = doc(this.db, 'contact', emailSend)
			const result = await setDoc(user, {
			name: name,
			emailSend: emailSend,
			time: date.toUTCString(),
			messageText: messageText
		});
		callback();
		} catch (error) {
		console.log(emailSend);
		console.log(error);
		}
}
	
		
	
}

module.exports = new Firebase()