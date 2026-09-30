export function startLiveClock(){

    const timeElement = document.getElementById("liveTime");
    const dateElement = document.getElementById("liveDate");
    const greetingElement = document.getElementById("greeting");

    if(!timeElement || !dateElement || !greetingElement){
        return;
    }

    function update(){

        const now = new Date();

        const time = now.toLocaleTimeString("en-IN",{

            hour:"2-digit",
            minute:"2-digit",
            hour12:true

        });

        const date = now.toLocaleDateString("en-IN",{

            weekday:"long",
            day:"numeric",
            month:"long"

        });

        const hour = now.getHours();

        let greeting = "";

        if(hour >= 5 && hour < 12){

            greeting = "Good Morning";

        }else if(hour >= 12 && hour < 17){

            greeting = "Good Afternoon";

        }else if(hour >= 17 && hour < 21){

            greeting = "Good Evening";

        }else{

            greeting = "Good Night";

        }

        timeElement.textContent = time;
        dateElement.textContent = date;
        greetingElement.textContent = greeting;

    }

    update();

    setInterval(update,1000);

}