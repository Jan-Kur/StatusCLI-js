import { WebClient } from '@slack/web-api';
import { Box, Newline, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import open from "open";
import React, { useEffect, useState } from 'react';

export default function App() {

   const clientID = "__SLACK_CLIENT_ID__"
   const clientSecret = "__SLACK_CLIENT_SECRET__"
   const redirectURL = "__SLACK_REDIRECT_URL__"

   const [state, setState] = useState<'start' | 'codeInput' | 'statusInput' | 'emojiInput' | 'end'>('start')
   const [code, setCode] = useState("")
   const [errorMsg, setErrorMsg] = useState("")
   const [status, setStatus] = useState("")
   const [emoji, setEmoji] = useState("")
   const [name, setName] = useState("")
   const [slackClient, setSlackClient] = useState<WebClient>()

   useEffect(() => {
      if (state === "end") {
         const timer = setTimeout(() => {
            process.exit()
         }, 3500)
         return () => clearTimeout(timer)
      }
      return undefined
   }, [state])

   useInput((input, key) => {
      if (state === "start") {
         if (input === "q") {
            process.exit()
         } else if (key.return) {
            open(getSlackURL())
            setState('codeInput')
         }
      } else if (state === "codeInput") {
         if (input === "q") {
            process.exit()
         } else if (key.return) {
            if (code.trim() === "") {
               setErrorMsg("Please enter the code\n\n")
               return
            }
            (async ()=> {
               try {
                  const {token, userId} = await exchangeCodeForToken(code.trim())
                  const api = new WebClient(token)
                  const user = await api.users.profile.get({user: userId})
                  setStatus(user.profile?.status_text || "")
                  setEmoji(user.profile?.status_emoji || "")
                  setSlackClient(api)
                  setName(user.profile?.display_name || user.profile?.first_name || "Stranger")
                  setErrorMsg("")
                  setState("statusInput")
               } catch {
                  setErrorMsg("Couldn't authenticate with slack")
               }
            })()  
         }
      } else if (state === "statusInput") {
         if (input === "q") {
            process.exit()
         } else if (key.return) {
            setErrorMsg("")
            setState("emojiInput")
         }
      } else if (state === "emojiInput") {
         if (input === "q") {
            process.exit()
         } else if (key.return) {
            (async ()=> {
               try {
                  await slackClient?.users.profile.set({
                     profile: {
                        status_text: status,
                        status_emoji: emoji
                     }
                  })
                  setErrorMsg("")
                  setState("end")
               } catch {
                  setErrorMsg("Couldn't update your status")
               }
            })()
         }
      } else if (state === "end") {
         if (input === "q") {
            process.exit()
         }
      }
   })

   function getSlackURL() : string {
      const params = new URLSearchParams()

      if (clientID) params.append("client_id", clientID)
      if (redirectURL) params.append("redirect_uri", redirectURL)

      params.append("user_scope", "users.profile:write,users:read,users.profile:read")

      return "https://slack.com/oauth/v2/authorize?" + params.toString()
   }

   async function exchangeCodeForToken(code: string) : Promise<{ token: string, userId: string }> {
      const data = new URLSearchParams()
      
      if (clientID) data.append("client_id", clientID)
      if (redirectURL) data.append("redirect_uri", redirectURL)
      if (clientSecret) data.append("client_secret", clientSecret)
      data.append("code", code)

      const resp = await fetch("https://slack.com/api/oauth.v2.access", {
         method: "POST",
         headers: {
            "Content-Type": "application/x-www-form-urlencoded",
         },
         body: data.toString()
      })

      const json = await resp.json()
      if (!json.ok) {
         throw new Error("Authorization failed")
      }

      return {
         token: json.authed_user?.access_token,
         userId: json.authed_user.id
      }
   }

	return (
      <>
         {state === "start" && (
            <>
               <Text >
                  Press <Text color="green">enter</Text> to log in with slack
               </Text>
               <Newline count={2}/>
               <Text dimColor color={"red"}>{errorMsg}</Text>
               <Box>
                  <Text dimColor>Press </Text>
                  <Text color={"blue"}>q</Text>
                  <Text dimColor> to quit</Text>
               </Box>
            </>
         )}

         {state === "codeInput" && (
            <>
               <TextInput value={code} onChange={setCode} placeholder='Input the code here...'/>
               <Newline count={2}/>
               <Text dimColor color={"red"}>{errorMsg}</Text>
               <Box>
                  <Text dimColor>Press </Text>
                  <Text color={"blue"}>q</Text>
                  <Text dimColor> to quit</Text>
               </Box>
            </>
         )}

         {state === "statusInput" && (
            <>
               <Text>Welcome {name}</Text>
               <Newline count={1}/>
               <Text dimColor>Your status:</Text>
               <TextInput value={status} onChange={setStatus} 
                  placeholder='Input the new status here...' focus/>
               <Newline count={1}/>
               <Text dimColor color={"red"}>{errorMsg}</Text>
               <Box>
                  <Text dimColor>Press </Text>
                  <Text color={"blue"}>q</Text>
                  <Text dimColor> to quit</Text>
               </Box>
            </>
         )}

         {state === "emojiInput" && (
            <> 
               <Text>Welcome {name}</Text>
               <Newline count={1}/>
               <Text dimColor>Your status:</Text>
               <Text>{status}</Text>
               <Text>{"\n"}</Text>
               <Text dimColor>Your status emoji:</Text>
               <TextInput value={emoji} onChange={setEmoji} placeholder='Input the new status emoji here' focus/>
               <Newline count={1}/>
               <Text dimColor color={"red"}>{errorMsg}</Text>
               <Box>
                  <Text dimColor>Press </Text>
                  <Text color={"blue"}>q</Text>
                  <Text dimColor> to quit</Text>
               </Box>
            </>
         )}

         {state === "end" && !errorMsg && (
            <>
               <Text color={"green"}>✅ SUCCESS ✅</Text>
               <Text>{"\n"}</Text>
               <Text>Enjoy your new status {name} 😊</Text>
               <Text>Have a good day</Text>
               <Newline count={1}/>
               <Box>
                  <Text dimColor>Press </Text>
                  <Text color={"blue"}>q</Text>
                  <Text dimColor> to quit</Text>
               </Box>
            </>
         )}

         {state === "end" && errorMsg && (
            <>
               <Text color={"red"}>❌ FAILED ❌</Text>
               <Text>{"\n"}</Text>
               <Text>We couldn't update your status 😔</Text>
               <Text>Have a good day</Text>
               <Newline count={1}/>
               <Box>
                  <Text dimColor>Press </Text>
                  <Text color={"blue"}>q</Text>
                  <Text dimColor> to quit</Text>
               </Box>
            </>
         )}
      </> 
	);
}
