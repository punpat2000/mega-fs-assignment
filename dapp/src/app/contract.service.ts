import { Injectable } from '@angular/core';
import type { AbiItem } from 'web3-utils';
import type { Contract } from 'web3-eth-contract';
import Web3 from 'web3';
import { ABI } from './constants/abi.const';
import { cETH } from './constants/cETH.const';
import detectEthereumProvider from '@metamask/detect-provider';
import { BehaviorSubject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ErrorModal } from './modal/error.component';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private web3: Web3;
  private userWeb3!: Web3;
  private CEther: Contract;
  connected = false;
  walletAddress = new BehaviorSubject<false | string>(false);
  underlyingBalance = new BehaviorSubject(0);
  walletBalance = new BehaviorSubject(0);
  $exchangeRate = new BehaviorSubject(0);

  constructor(private modalService: NgbModal) {
    if (!(window as any).ethereum) {
      const modalRef = this.modalService.open(ErrorModal);
      modalRef.componentInstance.message =
        'Metamask wallet is not detected. Please install Metamask wallet or reload this page!';
    }

    this.web3 = new Web3((window as any).ethereum);
    console.log(this.web3);

    this.CEther = new this.web3.eth.Contract(ABI as unknown as AbiItem[], cETH);
    this.updateWalletAddress().then(() => {
      this.getUnderlyingBalance();
      this.getWalletBalance();
    });
  }

  async getSupplyApy(): Promise<number> {
    const rate = await this.getSupplyRatePerBlock();
    const ethMantissa = 1e18;
    const blocksPerDay = 6570; // 13.15 seconds per block
    const daysPerYear = 365;
    console.log(rate);
    const supplyApy =
      Math.pow((+rate / ethMantissa) * blocksPerDay + 1, daysPerYear - 1) - 1;
    return supplyApy;
  }

  async connectWallet() {
    try {
      const provider = await detectEthereumProvider({ mustBeMetaMask: true });
      (provider as any).on('accountsChanged', (accounts: string[]) => {
        console.log('on account changed called');
        if (accounts.length > 0) {
          this.walletAddress.next(accounts[0]);
          this.getUnderlyingBalance();
          this.getWalletBalance();
        } else {
          this.walletAddress.next(false);
        }
        location.reload();
      });

      (provider as any).on('chainChanged', () => {
        location.reload();
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
    } catch (err) {
      const modalRef = this.modalService.open(ErrorModal);
      modalRef.componentInstance.message =
        'There is a problem connecting to the wallet. Please try again.';
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

  async getTotalSupply(): Promise<string> {
    return (await this.CEther.methods.totalSupply().call()) as string;
  }

  async getSupplyRatePerBlock(): Promise<string> {
    return (await this.CEther.methods.supplyRatePerBlock().call()) as string;
  }

  async getTotalSupplyInETH(): Promise<number> {
    const [exchangeRate, totalSupply] = await Promise.all([
      this.getExchangeRate(),
      this.getTotalSupply(),
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
    this.$exchangeRate.next(ETHIncETH);
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
    if (account) {
      this.web3.eth.getBalance(account, (err, balance) => {
        console.log(err, balance);
        const amount = +this.web3.utils.fromWei(balance, 'ether');
        console.log('wallet balance: ', balance, account);
        this.walletBalance.next(amount);
        return amount;
      });
    }
    this.walletBalance.next(0);
    return 0;
  }

  async mint(amount: number) {
    if (amount < 0) {
      throw new Error('negative input amount not allowed');
    }

    const account = this.walletAddress.getValue() as string;
    const value = this.web3.utils.toHex(
      this.web3.utils.toWei(amount.toString(), 'ether')
    );
    const res = await this.CEther.methods.mint().send({
      from: account,
      value: value,
    });

    return res;
  }

  async redeem(amount: number) {
    if (amount < 0) {
      throw new Error('negative input amount not allowed');
    }

    const account = this.walletAddress.getValue() as string;
    const value = parseFloat(amount.toFixed(7)) * 10e7;
    const res = await this.CEther.methods.redeem(value.toString()).send({
      from: account,
    });

    return res;
  }
}
