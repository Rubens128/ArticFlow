import { Button } from "../../components/button/button"
import { Input } from "../../components/input/input"
import { Logo } from "../../components/logo/logo"
import { useNavigate } from "react-router-dom";
import styles from "./register.module.css"

export default function Register() {
  const navigate = useNavigate();

  return (
    <form action="" onSubmit={async (e) => {

      if(!e.currentTarget.checkValidity()){
        e.preventDefault();
        
        e.currentTarget.reportValidity();
        
        return;
      }

      e.preventDefault();

      const formInfo = new FormData(e.currentTarget);
      const nick = String(formInfo.get("username") || "");
      const email = String(formInfo.get("email") || "").trim().toLowerCase();
      const password = String(formInfo.get("password") || "");

      if(!nick || !email || !password) return;

      try{

        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nick, email, password }),
        });

        if(res.status == 201){

          console.log("Usuário registrado com sucesso!");
          
          navigate("/");

          return;
        }

        const data = await res.json();

        if(/nick/i.test(data.error)){
          
          const inputError = document.getElementById("username") as HTMLInputElement | null;
          
          inputError?.setCustomValidity(data.error);
          inputError?.reportValidity();

        }else if(/e-mail|email/i.test(data.error)){
          
          const inputError = document.getElementById("email") as HTMLInputElement | null;
          
          inputError?.setCustomValidity(data.error);
          inputError?.reportValidity();
        
        }else if(/password/i.test(data.error)){
          
          const inputError = document.getElementById("password") as HTMLInputElement | null;
          
          inputError?.setCustomValidity(data.error);
          inputError?.reportValidity();
        
        } else{

          alert(data.error ?? "Erro ao registrar.");
        }

      } catch(err){

        alert("Falha de conexão. Tente novamente.");
      }
    }}>
      <main className = {styles.body}>
        <div className = {styles.div}>
          <div className= {styles.divPageInfo}>
             <Logo classNameImage={"w-[clamp(1rem,5dvw ,8rem)]"} classNameDiv={"text-[clamp(1rem,3.5dvw,5rem)] gap-[25px]"}></Logo>
            <h1>Sign Up</h1>
          </div>
          <div className = {styles.divInfoInputs}>
            <Input text="Email" type="email" name="email" id="email" autoComplete="email" inputMode="email" spellCheck={false}
            onInput={(e) => {e.currentTarget.setCustomValidity("");}}></Input>

            <Input text="Username" type="text" name="username" id="username" autoComplete="username" 
            spellCheck={false} minLength={3} maxLength={32} onKeyDown= {(e) => {
              if(e.key === " "){
                e.preventDefault();
              }
            }} 
            onInput={(e) => {e.currentTarget.setCustomValidity("");}} ></Input>

            <Input text="Password" type="password" name="password" id="password" 
            autoComplete="new-password" spellCheck={false}
            pattern="^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9_]).{8,}$"
            title="A senha deve ter: 8+ caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial."
            onInput={(e) => {
              e.currentTarget.setCustomValidity("");

              const confirmPassword = document.getElementById("confirmPassword") as HTMLInputElement | null;
              if(confirmPassword){

                if(confirmPassword.value !== e.currentTarget.value){
                
                  confirmPassword.setCustomValidity("As senhas não coincidem.");
                
                }else{
                
                  confirmPassword.setCustomValidity("");
                }
              }
            }}  
            ></Input>

            <Input text="Confirm Password" type="password" name="confirmPassword" id="confirmPassword" 
            autoComplete="new-password" spellCheck={false} onInput={(e) => {
              e.currentTarget.setCustomValidity("");

              const confirmPassword = e.currentTarget;
              const password = document.getElementById("password") as HTMLInputElement;

              if (password && confirmPassword.value !== password.value) {
                confirmPassword.setCustomValidity("As senhas não coincidem.");
              } else {
                confirmPassword.setCustomValidity("");
              }
            }}></Input>
          </div>
          <Button text="Register" type="submit"></Button>
        </div>
      </main>
    </form>
  );
}