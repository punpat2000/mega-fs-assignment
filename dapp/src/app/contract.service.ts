import { Injectable } from '@angular/core';
import type { AbiItem } from 'web3-utils';
import type { Contract } from 'web3-eth-contract';
import Web3 from 'web3';
import { ABI } from './abi';
import detectEthereumProvider from '@metamask/detect-provider';
import { BehaviorSubject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ContractService {
	private cETH = '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e';
	private web3: Web3;
	private userWeb3!: Web3;
	private CEther: Contract;
	connected = false;
	walletAddress: BehaviorSubject<false | string> = new BehaviorSubject<
		false | string
	>(false);
	underlyingBalance = new BehaviorSubject(0);
	walletBalance = new BehaviorSubject(0);

	constructor() {
		this.web3 = new Web3(
			new Web3.providers.WebsocketProvider(
				'wss://rinkeby.infura.io/ws/v3/09c39bf828a9431b84a89602ba6e3630'
			)
		);

		this.CEther = new this.web3.eth.Contract(
			ABI as unknown as AbiItem[],
			this.cETH
		);
		this.updateWalletAddress().then(() => {
			this.getUnderlyingBalance();
			this.getWalletBalance();
		});
	}

	async getSupplyApy(): Promise<number> {
		const rate = await this.supplyRatePerBlock();
		const ethMantissa = 1e18;
		const blocksPerDay = 6570; // 13.15 seconds per block
		const daysPerYear = 365;
		console.log(rate);
		const supplyApy =
			Math.pow((+rate / ethMantissa) * blocksPerDay + 1, daysPerYear - 1) - 1;
		return supplyApy;
	}

	async connectWallet() {
		const provider = await detectEthereumProvider({ mustBeMetaMask: true });
		(provider as any).on('accountsChanged', (accounts: string[]) => {
			if (accounts.length > 0) {
				this.walletAddress.next(accounts[0]);
				this.getUnderlyingBalance();
				this.getWalletBalance();
			} else {
				this.walletAddress.next(false);
			}
		});

		if (provider) {
			await (provider as any).request({ method: 'eth_requestAccounts' });
			this.userWeb3 = new Web3(provider as any);
			this.updateWalletAddress();
			return true;
		} else {
			console.log('Please install MetaMask!');
			return false;
		}
	}

	async updateWalletAddress(): Promise<false | string> {
		const provider = await detectEthereumProvider({ mustBeMetaMask: true });
		if (!(provider as any).isConnected()) {
			this.walletAddress.next(false);
			console.log('not connected');
			return false;
		}

		this.userWeb3 = new Web3(provider as any);
		const currentAccAddress = (await this.userWeb3.eth.getAccounts())[0];
		this.walletAddress.next(currentAccAddress);
		return currentAccAddress;
	}

	async getHashrate(): Promise<number> {
		return await this.web3.eth.getHashrate();
	}

	async totalSupply(): Promise<string> {
		return (await this.CEther.methods.totalSupply().call()) as string;
	}

	async supplyRatePerBlock(): Promise<string> {
		return (await this.CEther.methods.supplyRatePerBlock().call()) as string;
	}

	async totalSupplyInETH(): Promise<number> {
		const [exchangeRate, totalSupply] = await Promise.all([
			this.getExchangeRate(),
			this.totalSupply(),
		]);
		const totalAmount = +totalSupply / 10e7 / exchangeRate;
		console.log(+totalSupply / 10e7);
		return totalAmount;
	}

	/**
	 * return exchange rate for 1 ETH according to Rnkeby network
	 */
	async getExchangeRate(): Promise<number> {
		const cETHDecimals = 8; // all cTokens have 8 decimal places
		const underlyingETHDecimals = 18;
		const exchangeRateCurrent = await this.CEther.methods
			.exchangeRateCurrent()
			.call();
		const mantissa = 18 + underlyingETHDecimals - cETHDecimals;
		const oneCTokenInUnderlying = exchangeRateCurrent / Math.pow(10, mantissa);
		const ETHIncETH = 1 / oneCTokenInUnderlying;
		console.log('1 ETH can be redeemed for', ETHIncETH, 'cETH');
		return ETHIncETH;
	}

	async getUnderlyingBalance(): Promise<number> {
		const account = this.walletAddress.getValue();
		if (typeof account === 'string') {
			const tokens = await this.CEther.methods
				.balanceOfUnderlying(account)
				.call();
			const amount = +this.web3.utils.fromWei(tokens, 'ether');
			console.log(tokens, 'underlying tokens');
			this.underlyingBalance.next(amount);
			return amount;
		}
		console.log('0 underlying tokens');
		this.underlyingBalance.next(0);
		return 0;
	}

	async getWalletBalance(): Promise<number> {
		const account = this.walletAddress.getValue();
		console.log('here', account);
		if (typeof account === 'string') {
			this.web3.eth.getBalance(account, (err, balance) => {
				const amount = +this.web3.utils.fromWei(balance, 'ether');
				this.walletBalance.next(amount);
			});
		}
		this.walletBalance.next(0);
		return 0;
	}

	// async totalSupplyMainnet(): Promise<string> {
	// 	return (await this.CEtherMainnet.methods.totalSupply().call()) as string;

	// }
	// /**
	//  * return exchange rate for 1 ETH according to Rnkeby network
	//  */
	// async getExchangeRateMainnet(): Promise<number> {
	// 	const cETHDecimals = 8;
	// 	const underlyingETHDecimals = 18;
	// 	const exchangeRateCurrent = await this.CEtherMainnet.methods
	// 		.exchangeRateCurrent()
	// 		.call();
	// 	const mantissa = 18 + underlyingETHDecimals - cETHDecimals;
	// 	const oneCTokenInUnderlying = exchangeRateCurrent / Math.pow(10, mantissa);
	// 	const ETHIncETH = 1 / oneCTokenInUnderlying;
	// 	console.log('1 ETH can be redeemed for', ETHIncETH, 'cETH');
	// 	return ETHIncETH;
	// }

	// async totalSupplyInETHMainnet(): Promise<number> {
	// 	const [exchangeRate, totalSupply] = await Promise.all([
	// 		this.getExchangeRateMainnet(),
	// 		this.totalSupplyMainnet(),
	// 	]);
	// 	const totalAmount = +totalSupply / 10e7 / exchangeRate;
	// 	console.log(totalAmount);
	// 	return totalAmount;
	// }

	// async supplyRatePerBlockMainnet(): Promise<string> {
	// 	return (await this.CEtherMainnet.methods
	// 		.supplyRatePerBlock()
	// 		.call()) as string;
	// }

	// async getSupplyApyMainnet(): Promise<number> {
	// 	const rate = await this.supplyRatePerBlockMainnet();
	// 	const ethMantissa = 1e18;
	// 	const blocksPerDay = 6570;
	// 	const daysPerYear = 365;
	// 	console.log(rate);
	// 	const supplyApy =
	// 		Math.pow((+rate / ethMantissa) * blocksPerDay + 1, daysPerYear - 1) - 1;
	// 	return supplyApy;
	// }
}
