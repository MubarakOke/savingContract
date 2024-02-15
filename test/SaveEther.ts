import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect, assert } from "chai";
  import { ethers } from "hardhat";
  
  
  describe("SaveEther Contract Test", function () {
    async function deploySaveEther(){
      const SaveEther = await ethers.getContractFactory("SaveEther");
      const saveEther = await SaveEther.deploy();
      const [account1, account2] = await ethers.getSigners();
      const amountToDeposit = ethers.parseEther("1.0");
      return { saveEther, account1, account2, amountToDeposit };
    };
  
  
    describe("Contract", async () => {
        it("can deposit and check savings", async () => {
            const { saveEther, account1, amountToDeposit} = await loadFixture(deploySaveEther);
            await saveEther.deposit({ value: amountToDeposit });

            const balance = await saveEther.checkSavings(account1.address);
            expect(balance).to.equal(ethers.parseEther("1.0"));
        });

        it("cannot deposit 0 value", async () => {
            const { saveEther } = await loadFixture(deploySaveEther);
            await expect(saveEther.deposit({ value : 0 })).to.be.revertedWith( "can't save zero value");
        });

        it("emits SavingSuccessful after depositing", async () => {
            const { saveEther, account1, amountToDeposit } = await loadFixture(deploySaveEther);

            await expect(saveEther.deposit({ value: amountToDeposit }))
            .to.emit(saveEther, 'SavingSuccessful')
            .withArgs(account1.address, amountToDeposit);
        });

        it("can withdraw funds successfully ", async()=>{
            const { saveEther, account1, amountToDeposit } = await loadFixture(deploySaveEther);

            await saveEther.deposit({ value: amountToDeposit });

            const afterDepositBalance = await saveEther.checkSavings(account1.address);

            expect(afterDepositBalance).to.equal(amountToDeposit);

            await saveEther.withdraw();
            const afterWithdrawBalance = await saveEther.checkSavings(account1.address);
            expect(afterWithdrawBalance).to.equal(0);
        })

        it("can withdraw money only when user has deposited", async()=>{
            const { saveEther, account2, amountToDeposit } = await loadFixture(deploySaveEther);
            await saveEther.deposit({ value: amountToDeposit });
            const address2Signer= await ethers.getSigner(account2.address)

            await expect(saveEther.connect(address2Signer).withdraw()).to.be.revertedWith("you don't have any savings");
        });

        it("can send savings to another account ", async()=>{
            const { saveEther, account1 , account2, amountToDeposit} = await loadFixture(deploySaveEther);
            await saveEther.deposit({value: amountToDeposit});

            const amountToSend= ethers.parseEther("0.5");
            const beforeTransferBalance = await saveEther.checkSavings(account1.address);
            expect(beforeTransferBalance).to.equal(amountToDeposit);

            await saveEther.sendOutSaving(account2.address, amountToSend);

            const afterTransferBalance = await saveEther.checkSavings(account1.address)
            expect(afterTransferBalance).to.equal(amountToDeposit-amountToSend);
        });

        it("cannot send out 0 savings", async()=>{
            const { saveEther, account2 } = await loadFixture(deploySaveEther);
            const amountToSend= ethers.parseEther("0");

            await expect(saveEther.sendOutSaving(account2.address, amountToSend)).to.be.rejectedWith("can't send zero value")

        })

        it("cannot send out amount greater than savings", async()=>{
            const { saveEther, account1, account2, amountToDeposit } = await loadFixture(deploySaveEther);
            await saveEther.deposit({value: amountToDeposit});

            const amountToSend= ethers.parseEther("2");
            await expect(saveEther.sendOutSaving(account2.address, amountToSend)).to.be.rejectedWith("can't send out amount greater than savings")

        })
    })            
  });