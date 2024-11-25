window.onload = pageLoad;

function pageLoad(){
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	if (urlParams.get("error")==1){
		if (window.location.href.split('/').pop()== "register.html"){
			document.getElementById('errordisplay').innerHTML = "Registration Error!"
		}else{
			document.getElementById('errordisplay').innerHTML = "Username or password does not match.";
		}
		
	}	
}

// ดักจับฟอร์มการลงทะเบียน
const registerForm = document.getElementById('registerForm');
registerButton.addEventListener('click', (event) => {
    event.preventDefault(); // ป้องกันการส่งฟอร์มโดยตรง
    checkUsername(); // เรียกใช้ฟังก์ชันตรวจสอบ UserName
});


function checkUsername() {
    const username = document.getElementById('username').value;
    console.log("Username entered:", username); // ตรวจสอบค่าที่ใส่

    fetch(`/check-username?username=${username}`)
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                console.log("Username already exists"); // ตรวจสอบสถานะ
                alert("UserName นี้ถูกใช้งานไปแล้ว กรุณาเลือกชื่ออื่น");
            } else {
                console.log("Username available");
                registerForm.submit();
            }
        })
        .catch(err => console.error("Error:", err));
}


