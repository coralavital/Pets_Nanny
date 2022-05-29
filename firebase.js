const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, 
	deleteUser, sendPasswordResetEmail, reauthenticateWithCredential, EmailAuthProvider} = require("firebase/auth");
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, deleteDoc, deleteField , arrayUnion } = require('firebase/firestore');
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
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
  }
    
	async GetUsersEmails(){
		let users = await this.GetAllDataOnce();
		let userList = []
		for(var i=0; i<users.length; i++){
			if (users[i].email !== undefined)
			userList.push(users[i].email)
		}
		return userList;
	}

  //authenticate function
  authenticate(email, password, callback) {
	  signInWithEmailAndPassword(this.auth, email, password).then((cred) => {
      callback();
    }).catch(error => {
		switch (error.code) {
			case 'auth/email-already-in-use':
				console.log(`Email address ${this.state.email} already in use.`);
				break;
			case 'auth/invalid-email':
				console.log(`Email address ${this.state.email} is invalid.`);
				break;
			case 'auth/operation-not-allowed':
				console.log(`Error during sign up.`);
				break;
			case 'auth/user-not-found':
				console.log(`Email address is not exist`);
				break;
			case 'auth/wrong-password':
				console.log(`The entered password is not the current password of this user!`);
				break;
			default:
				console.log(error.message);
				break;
		}
			
		})
	
  }

  //signup function
  async signup(email, password, fullname, phone, type, callback, callbackErr) {
    createUserWithEmailAndPassword(this.auth, email, password).then(async (cred) => {
    	const coll = collection(this.db, 'users');
        const user = doc(this.db, 'users', email)
        const result = await setDoc(user, {
          fullname: fullname,
          phonenumber: phone,
          typeOfUser: type
        });
        callback();
    }).catch(error => {
		switch (error.code) {
			case 'auth/email-already-in-use':
			  console.log(`Email address ${email} already in use.`);
			  break;
			case 'auth/invalid-email':
			  console.log(`Email address ${email} is invalid.`);
			  break;
			case 'auth/operation-not-allowed':
			  console.log(`Error during sign up.`);
			  break;
			default:
			  console.log(error.message);
			  break;
		  }
	})

  }

  //logout function
  async logout(callback) {
  await signOut(this.auth).then((cred) => {
    console.log("Sign-out successful.")
    callback();
    });
  }

  //get currenct user firebase data
  async CurrentUserData() {
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
      about_me: about_me,
	  email: this.auth._currentUser.email,
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
async filtering(ar, price, typeP, typeS, start, end) {
	var providersResult =[];
	var i; 
	const coll = query(collection(this.db, 'users'), 
	 where("type_of_pet", "array-contains-any", typeP),
	 );
	const querySnapshot = await getDocs(coll);
	var result=[];
	querySnapshot.forEach((doc) => {
		result.push(doc.data())
	});
	if((end - start) <= 0) {
		var d = new Date(end);
		end = d.setDate(d.getDate() + 1);
	}
	for (i=0 ; i< result.length; i++) { 
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
	return providersResult;
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
    
	//change password of user
	async changePassword(cpassword, npassword) {
		const email = this.auth._currentUser.email;
		const usr = this.auth._currentUser;

		await reauthenticateWithCredential(usr, EmailAuthProvider.credential(email, cpassword))
		.then(() => {
			updatePassword(usr, npassword).then(() => {
				console.log("update password");
			}).catch((error) => {
				console.log("Error at updatePassword\n", error);
			})
		}).catch((error) => {
			switch (error.code) {
				case 'auth/wrong-password':
				  console.log(`The entered password is not the match to the current user password!`);
				  break;
				default:
					console.log("Error at reauthenticateWithCredential\n", error)
				break;
			  }
		})
		

	}

	//delete account
	async deleteAccount(callback) {
		var i=0;
		const userData = await this.CurrentUserData()
		if(userData.reservations != null && userData.typeOfUser == "1") {
			for(i=0; i<userData.reservations.length; i++) {
				var reserv = [];
				const docRef = doc(this.db, 'users', userData.reservations[i].clientEmail);
				const docSnap = await getDoc(docRef);
				var usr = docSnap.data();
				for(var j=0; j<usr.reservations.length; j++) {
					if(usr.reservations[j].start != userData.reservations[i].start && usr.reservations[j].end != userData.reservations[i].end) {
						reserv.push(usr.reservations[j]);
					}
				}
				await updateDoc(docRef, {
					reservations: reserv
				});
			}
		}
		else if(userData.reservations != null && userData.typeOfUser == "0") {
			for(i=0; i<userData.reservations.length; i++) {
				var reserv = [];
				const docRef = doc(this.db, 'users', userData.reservations[i].providerEmail);
				const docSnap = await getDoc(docRef);
				var usr = docSnap.data();
				for(var j=0; j<usr.reservations.length; j++) {
					if(usr.reservations[j].start != userData.reservations[i].start && usr.reservations[j].end != userData.reservations[i].end) {
						reserv.push(usr.reservations[j]);
					}
				}
				await updateDoc(docRef, {
					reservations: reserv
				});
			}
		}
		deleteDoc(doc(this.db, "users", this.auth._currentUser.email));
		deleteUser(this.auth._currentUser).then(async() => {
			console.log("deleted user");
		}).catch((error ) => {
			console.log("Eror")
		})
		callback();

	}
	
	//update provider document
	async addFreeTime(date, from, to, callback) {

		const userRef = doc(this.db, "users", this.auth._currentUser.email);
		const docSnap = await getDoc(userRef);
		const document = docSnap.data()
		from = from.concat(":00")
		to = to.concat(":00")
		const sdate = date.concat("T", from)
		const start = +new Date(sdate)
		const edate = date.concat("T", to)
		var end = +new Date(edate)

		const userData = await this.CurrentUserData()

		//get id for ecery reservation
		const uniqueId = () => {
			const dateString = Date.now().toString(36);
			const randomness = Math.random().toString(36).substr(2);
			return dateString + randomness;
		};
		if((end - start) <= 0) {
			var d = new Date(end);
			end = d.setDate(d.getDate() + 1);
		}

		await EnterTime({start, end});
		async function EnterTime({start, end}) {
			// get the specific free time obj
			try{
			if(document.freeTime != undefined){
				for(var i=0; i<document.freeTime.length; i++){
					if(document.freeTime[i].start == start && document.freeTime[i].end == end ||
						document.freeTime[i].start <= start && document.freeTime[i].end == end ||
						document.freeTime[i].start == start && document.freeTime[i].end >= end ||
						document.freeTime[i].start <= start && document.freeTime[i].end >= end) {	
							throw("Cannot save free time on free time object");
						}
					}
				}
				if(document.reservations != undefined){
					for(var i=0; i<document.reservations.length; i++){
						if(document.reservations[i].start == start && document.reservations[i].end == end ||
							document.reservations[i].start <= start && document.reservations[i].end == end ||
							document.reservations[i].start == start && document.reservations[i].end >= end ||
							document.reservations[i].start <= start && document.reservations[i].end >= end) {	
								throw("Cannot save free time on reservation time object");
							}
					}
				}

			let freeTimeObj = {start, end, title: "Free Time", id: uniqueId(), color: "green"};
			const freeTime = userData.freeTime !== undefined ? userData.freeTime :[];
			freeTime.push(freeTimeObj);
			await updateDoc(userRef, {
				freeTime
			});
			callback()
		} catch(e) {
			if(e == "Cannot save free time on free time object")
				console.log("Cannot save free time on free time object");
			else
				console.log("Cannot save free time on reservation time object");
		}

		}
	}

	async sendEmail(email, callback) {
		await sendPasswordResetEmail(this.auth, email).then(() => {
			callback();
			console.log("Sent reset password to you email!")

		}).catch((e) => {
			console.log(e)
		})
	}

	
	//saving reservations details
	async addReservation(date, from, to, provider, type_of_service, callback) {
		const clientRef = doc(this.db, "users", this.auth._currentUser.email);
		const providerRef = doc(this.db, "users", provider.email);
		from = from.concat(":00")
		to = to.concat(":00")
		const sdate = date.concat("T", from)
		const start = +new Date(sdate)
		const edate = date.concat("T", to)
		var end = +new Date(edate)
		const userData = await this.CurrentUserData()
		//get id for ecery reservation
		const uniqueId = () => {
			const dateString = Date.now().toString(36);
			const randomness = Math.random().toString(36).substr(2);
			return dateString + randomness;
		};

		if((end - start) <= 0) {
			var d = new Date(end);
			end = d.setDate(d.getDate() + 1);
		}

		var freeTimeItem;
		var newFreeTime = []
		var freeTimeObj;
		const docSnap = await getDoc(providerRef);
		const document = docSnap.data()
		for(var i=0; i<document.freeTime.length; i++){
			// get the specific free time obj
			if(document.freeTime[i].start == start && document.freeTime[i].end == end ||
				document.freeTime[i].start <= start && document.freeTime[i].end == end ||
				document.freeTime[i].start == start && document.freeTime[i].end >= end ||
				document.freeTime[i].start <= start && document.freeTime[i].end >= end) {	
				freeTimeItem = document.freeTime[i];
			}
			else {
				newFreeTime.push(document.freeTime[i])
			}
		}
		// updating free time arr obj
		switch(true){
			case start == freeTimeItem.start && end == freeTimeItem.end:
				break;
			case start >= freeTimeItem.start && end == freeTimeItem.end:
				freeTimeObj = {start: freeTimeItem.start, end: start, title: "Free Time", id: uniqueId(), color: "green"};
				newFreeTime.push(freeTimeObj)
				break;
			case start == freeTimeItem.start && end <= freeTimeItem.end:
				freeTimeObj = {start: end, end: freeTimeItem.end, title: "Free Time", id: uniqueId(), color: "green"};
				newFreeTime.push(freeTimeObj)
				break;
			case start >= freeTimeItem.start && end <= freeTimeItem.end:
				freeTimeObj = {start: freeTimeItem.start, end: start, title: "Free Time", id: uniqueId(), color: "green"};
				newFreeTime.push(freeTimeObj)
				freeTimeObj = {start: end, end: freeTimeItem.end, title: "Free Time", id: uniqueId(), color: "green"};
				newFreeTime.push(freeTimeObj)
				break;

		}

		await EnterTime({start, end});

		async function EnterTime({start, end}) {
			let reservationObj = {start, end, title: "Reservation", id: uniqueId(), color: 'red', providerName: provider.fullname, providerEmail: provider.email, 
									price: provider.price_per_hour, providerPhone: provider.phonenumber, address: userData.address , clientEmail: userData.email, typeS: type_of_service,
									clientName: userData.fullname};
			const clientReser = userData.reservations !== undefined ? userData.reservations :[];
			const providerReser = document.reservations !== undefined ? document.reservations :[];
			clientReser.push(reservationObj);
			providerReser.push(reservationObj);
			await updateDoc(clientRef, {
				reservations: clientReser
			});
			await updateDoc(providerRef, {
				reservations: providerReser,
				freeTime: newFreeTime
			});

		}
		callback()

	};

	//saving contact message details
	async addContactMsg(name, emailSender, messageText, callback) {
		// how the data will be saved in the obj arr
		let msgObj = {title: "contactUs", date: new Date(), user: emailSender, name: name, messageText: messageText};

		const email_msg_ref = doc(this.db, "contact", emailSender);

		try{ 
			// getting doc data 
			const docSnap = await getDoc(email_msg_ref);
			const contactMsg = docSnap.data();
			var msg_arr =  contactMsg !== undefined ? contactMsg.contactUs : []
		} catch(e) {
			console.log("Error! at addContactMsg function reseting array \n", e)
			msg_arr = []
		}

		msg_arr.push(msgObj);


		await setDoc(email_msg_ref, {
			contactUs: msg_arr
		});

		callback();
	};

	//saving cancel gree time
	async cancelFreeTime(id, callback) {
		var newFree = [];
		const providerRef = doc(this.db, "users", this.auth._currentUser.email);
		const docSnap = await getDoc(providerRef);
		const document = docSnap.data()
		for(var i=0; i<document.freeTime.length; i++){
			if(document.freeTime[i].id != id) {	
				newFree.push(document.freeTime[i])
			}
		}
		await updateDoc(providerRef, {
			freeTime: newFree
		});
		console.log("The free time deleted")
		callback();

	};

	//cancel reservation details
	async cancelReservation(id, emailProvider, emailClient, callback) {
		var newReservationsp = [];
		var newReservationsc = [];
		const providerRef = doc(this.db, "users", emailProvider);
		const clientRef = doc(this.db, "users", emailClient);
		const pdocSnap = await getDoc(providerRef);
		const providerDOC = pdocSnap.data()
		const cdocSnap = await getDoc(clientRef);
		const clientDOC = cdocSnap.data()
		for(var i=0; i<providerDOC.reservations.length; i++){
			if(providerDOC.reservations[i].id != id) {	
				newReservationsp.push(providerDOC.reservations[i])
			}
		}
		//var newFreeTime = document.freeTime.filter(document.freeTime => obj)
		await updateDoc(providerRef, {
			reservations: newReservationsp
		});
		for(var i=0; i<clientDOC.reservations.length; i++){
			if(clientDOC.reservations[i].id != id) {	
				newReservationsc.push(clientDOC.reservations[i])
			}
		}
		//var newFreeTime = document.freeTime.filter(document.freeTime => obj)
		await updateDoc(clientRef, {
			reservations: newReservationsc
		});
		console.log("The reservation deleted from the client schedule and from the provider schedule")
		callback();

	};


	
		
	
}

module.exports = new Firebase()