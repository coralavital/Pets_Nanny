class event {
	constructor(){
		this.freeTime = [
			{
				groupId: 'freetine',
				title: 'Repeating Event',
				start: '2021-04-16T16:00:00',
				end: '2021-04-16T21:00:00'
			},				
			  
			{
				groupId: 'freetine',
				title: 'Repeating Event',
				start: '2021-04-17T16:00:00',
				end: '2021-04-17T21:00:00'
			},

		]
		this.reservation = [
			{
				groupId: 'reservatin',
				title: 'Repeating Event',
				start: '2021-04-10T16:00:00',
				end: '2021-04-10T19:00:00'
			},
		]
	}
}

module.exports = new event();