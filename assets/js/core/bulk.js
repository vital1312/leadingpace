class UI {
    static callDatabase(){
        const api="https://leadingpace.pythonanywhere.com/traininghistory"
        const token = window.localStorage.getItem("token")
        if (token == null){
            window.location.replace("login.html")
        }

        const myHeaders={"x-access-token":token}
        
        fetch(api,{
            method:"GET",
            headers: myHeaders
        })
        .then(response=>{
            if (response.status === 200) {

                return response.json();
              } else {
                console.log("Token expired log in again ")
                window.localStorage.clear();
                window.location.replace("login.html")
                throw new Error('Something went wrong on api server!');
                
              }
        })
        .then(response => {
            console.debug(response);
            for (var i in response.entries){
                var id=response.entries[i].id
                var date=response.entries[i].date
                var duration=response.entries[i].duration
                var distance=response.entries[i].distance
                var avgHr=response.entries[i].avgHr
                var runningIndex= response.entries[i].runningIndex
                var stressScore=response.entries[i].stressScore
                var up= response.entries[i].ascent
                var down=response.entries[i].descent
                var entry = {"id":id,"date": date,"duration":duration,"distance":distance,"avgHr":avgHr,"runningIndex":runningIndex,"stressScore":stressScore,"ascent":up,"descent":down}
                UI.showEntry(entry)

                if (response.message){
                    alert(response.message)
                }
            }
            
            
          }).catch(error => {
            console.error(error);
          });
    }
    
    static showEntry(entry){

        var row = document.querySelector("#exportText")
        row.setAttribute("class","text-white")
        row.innerHTML+=
        `
        <br>${formatDate(entry.date)},${entry.duration},${entry.distance},${entry.avgHr},${entry.ascent},${entry.descent},0
        `

        
        



    }

}
function readfile(){
    fileToRead = document.querySelector(".csvupload").files[0]
    getAsText(fileToRead)
}

function getAsText(fileToRead) {
    var reader = new FileReader();
    // Read file into memory as UTF-8      
    reader.readAsText(fileToRead);
    // Handle errors load
    reader.onload = loadHandler;
    reader.onerror = errorHandler;
  }

  function loadHandler(event) {
    var csv = event.target.result;
    csvJSON(csv);
  }


  function errorHandler(evt) {
    if(evt.target.error.name == "NotReadableError") {
        alert("Canno't read file !");
    }
  }


function csvJSON(csv){

    var lines=csv.split("\n");
  
    var result = [];
  
    var headers=lines[0].split(",");
  
    for(var i=1;i<lines.length;i++){
        
        var obj = {};
        var currentline=lines[i].split(",");
  
        for(var j=0;j<headers.length;j++){

            obj[headers[j]] = currentline[j];
        }
  
        result.push(obj);
  
    }
    
    
    for (var i=0;i<result.length; i++){
        result[i].runningIndex = calcRunningIndex(result[i])
        output = calcTrimpTss(result[i])
        result[i].trimp = output[0]
        result[i].tss = output[1]

        
    } ; 
    sendToDatabase(result)
}

function sendToDatabase(result){

    
    console.log(JSON.stringify(result))
    var token=window.localStorage.getItem('token')
    const myHeaders={"x-access-token":token,"Content-Type": "application/json",'access-control-allow-origin':"*"}
    
    
    
    var link="https://leadingpace.pythonanywhere.com/bulk_import"
    

    fetch(link,{
        method:'POST',
        headers:myHeaders,
        body: JSON.stringify(result)
    })

    .then(response =>{
        if (response.status === 200){
            alert("saved succesfully")
            return response.json();
        } else{
            console.log('error');
        }
    })
    .then(response =>{
        console.debug(response);
        
    })


}



document.querySelector("#exportButton").addEventListener("click",UI.callDatabase)
document.querySelector("#csvSubmit").addEventListener("click",readfile)


function calcRunningIndex(entry){
    var max_hr = localStorage.getItem('max_hr')
    var x = entry.hr/max_hr*1.45-0.30
    var distance = Number(entry.distance)
    var up = Number(entry.up)
    var down = Number(entry.down)
    var d = distance + 6*up - 4*down
    var RIO = (213.9/entry.duration) * Math.pow(d/1000,1.06) +3.5
    var runningIndex = RIO/x

    console.log(entry.hr,entry.distance,max_hr,x,d,RIO,runningIndex,entry.up)
    
    return runningIndex.toFixed(2)
}
       
function calcTrimpTss(entry){

       var rest_hr = localStorage.getItem("rest_hr")
       var max_hr = localStorage.getItem("max_hr")
       var lactate_th = localStorage.getItem("lactate_th")
       //calculate trimp and tss
       var hrr = (entry.hr-rest_hr)/(max_hr-rest_hr)
       trimp=0
       Math.round(entry.duration)
       for (var i=0;i<entry.duration;i++){
           trimp = trimp + 1 * hrr * 0.64 * Math.exp(1.92 * hrr)
       }
       
       var hr_lthr = (lactate_th - rest_hr)/(max_hr - rest_hr)
       var hour_lthr = 60 * hr_lthr * 0.64 * Math.exp(1.92 * hr_lthr)
       var tss =  (trimp/hour_lthr)*100

       return [trimp,tss.toFixed(2)]

}    

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day, year].join('/');
}



document.querySelector("#logout").addEventListener("click",logout)

function logout(){
    window.localStorage.clear()
    window.location.replace("login.html")
}