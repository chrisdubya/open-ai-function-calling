import { useState } from "react";
import axios from "axios";

function App() {
	const [locationPrompt, setLocationPrompt] = useState<string>();
	const [weatherResponse, setWeatherResponse] = useState<string>();

	const getCurrentWeather = (location: string) => {
		let config = {
			method: "get",
			maxBodyLength: Infinity,
			url: `https://api.tomorrow.io/v4/weather/realtime?apikey=${
				process.env.REACT_APP_TOMORROW_API_KEY
			}&location=${encodeURIComponent(location)}`,
			headers: {
				accept: "application/json",
			},
		};

		axios
			.request(config)
			.then((response) => {
				setWeatherResponse(
					`${response?.data?.location?.name} ${response?.data?.data?.values?.temperature}`
				);
			})
			.catch((error) => {
				console.log(error);
			});
	};

	const parseResponse = (data: any) => {
		data.choices?.forEach((choice: any) => {
			if (choice.message?.function_call?.name === "getCurrentWeather") {
				const parsedLocation = JSON.parse(
					choice.message.function_call.arguments
				);

				getCurrentWeather(parsedLocation?.location);
			}
		});
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();

		let data = JSON.stringify({
			model: "gpt-3.5-turbo-0613",
			messages: [
				{
					role: "user",
					content: locationPrompt,
				},
			],

			functions: [
				{
					name: "getCurrentWeather",
					description: "Get the current weather in a given location",
					parameters: {
						type: "object",
						properties: {
							location: {
								type: "string",
								description: "The city e.g. San Francisco",
							},
							unit: {
								type: "string",
								enum: ["celsius", "fahrenheit"],
							},
						},
						required: ["location"],
					},
				},
			],
		});

		let config = {
			method: "post",
			maxBodyLength: Infinity,
			url: "https://api.openai.com/v1/chat/completions",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
			},
			data: data,
		};

		axios
			.request(config)
			.then((response) => {
				parseResponse(response.data);
			})
			.catch((error) => {
				console.log(error);
			});
	};

	return (
		<div className='w-full h-screen bg-slate-700 flex flex-col justify-center items-center text-white'>
			<div className='mb-4'>
				<form onSubmit={handleSubmit}>
					<input
						placeholder='Ask me..'
						className='border border-black rounded-md mr-2 px-2 text-black'
						onChange={(e) => setLocationPrompt(e.target.value)}
						type='text'></input>

					<button
						className='border border-black rounded-md px-2 bg-white text-black'
						type='submit'>
						Submit
					</button>
				</form>
			</div>

			{weatherResponse && <div>Response: {weatherResponse}</div>}
		</div>
	);
}

export default App;
