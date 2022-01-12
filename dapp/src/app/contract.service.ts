import { Injectable } from '@angular/core';
import type { AbiItem } from 'web3-utils';
import type { Contract } from 'web3-eth-contract';
import Web3 from 'web3';
import { ABI } from './abi';
import detectEthereumProvider from '@metamask/detect-provider';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private cETH = '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e';
  private web3: Web3;
  private userWeb3!: Web3;
  private CEther: Contract;
  connected = false;

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

  async ethEnabled(): Promise<false | string> {
    const provider = await detectEthereumProvider({ mustBeMetaMask: true });
    if (provider) {
      // From now on, this should always be true:
      // provider === window.ethereum
      await (provider as any).request({ method: 'eth_requestAccounts' });
      this.userWeb3 = new Web3(provider as any);
      const currentAccAddress = (await this.userWeb3.eth.getAccounts())[0];
      console.log(currentAccAddress);
      return currentAccAddress;
    } else {
      console.log('Please install MetaMask!');
      return false;
    }
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
