import React, { Component } from "react"
import { View, Text, Button, TouchableOpacity, Animated, Image, TextInput } from "react-native"
import PhoneInput from 'react-native-phone-input'
import CodeInput from 'react-native-confirmation-code-input';
import styles from "../../styles"
import { firestore, functions, auth, storage } from "../../../firebase/Fire"
import { ImagePicker, Permissions } from 'expo';

export default class AuthenticationPopup extends Component {
    constructor() {
        super()
        this.state = {
            phoneNumber: null,
            phoneAuthOpacity: new Animated.Value(1),
            verificationAuthOpacity: new Animated.Value(0),
            userNameOpacity: new Animated.Value(0),
            phoneAuthZPosition: 3,
            codeAuthZPosition: 2,
            nameZPosition: 1,
            text: "",
            phone: "",
            userId: "",
            token: "",
            image: null
        }
    }
    componentDidMount() {
        // updateUserName("u3oBMz4ZQrbeWBfvCx6IMZLQcfE2", "alan", "alanyoh@gmail.com")
        // firestore.collection("users").doc("u3oBMz4ZQrbeWBfvCx6IMZLQcfE2").update({ name: "Alan" })
    }

    verifyNumber = async () => {
        const enteredNumber = this.phone.getValue()
        if (this.phone.isValidNumber()) {
            try {
                await functions.httpsCallable("logInWithPhoneNumber")({ phone: enteredNumber })
                this.fadeOutPhoneAuth()
            } catch (error) {
                console.error("here's the big error:", error)
            }
            this.setState({ phoneNumber: enteredNumber })
        }
    }

    verifyCode = async (code) => {
        try {
            console.log("trying to do it!")
            const { data } = await functions.httpsCallable("verifyToken")({ code: code, phone: this.state.phoneNumber })
            console.log("here's the token!!", data)
            this.setState({ token: data })
            this.fadeOutCodeAuth()
        } catch (err) {
            console.error(err)
        }
    }

    signUserIn = async (token, name, email, phone) => {
        try {
            console.log("userInputtedName:", this.state.text)
            await functions.httpsCallable("updateUserInfo")({ name: name, email: "@", phone: phone })
            this.uploadImage(this.state.image);
            this.props.closePanel()
            await auth.signInWithCustomToken(token)
        } catch (err) {
            console.error(err)
        }
    }

    pickImage = async () => {
        let { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
        });
        if (!result.cancelled) {
            this.setState({ image: result.uri });
        }
    }
    uploadImage = async (uri) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        var ref = storage.ref().child(this.state.phoneNumber);
        return ref.put(blob);
    }



    fadeOutPhoneAuth = () => {
        Animated.timing(this.state.phoneAuthOpacity, { toValue: 0 }).start();
        Animated.timing(this.state.verificationAuthOpacity, { toValue: 1, }).start();
        this.setState({ phoneAuthZPosition: 2, codeAuthZPosition: 3 })
    }

    fadeOutCodeAuth = () => {
        Animated.timing(this.state.verificationAuthOpacity, { toValue: 0 }).start();
        Animated.timing(this.state.userNameOpacity, { toValue: 1 }).start();
        this.setState({ codeAuthZPosition: 1, nameZPosition: 3 })
    }

    render() {
        return (
            <View style={
                {
                    flex: 1,
                    backgroundColor: 'white',
                    justifyContent: "flex-start",
                    alignItems: 'center',
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    padding: 20
                }
            }>
                <Animated.View style={{ opacity: this.state.phoneAuthOpacity, zIndex: this.state.phoneAuthZPosition }}>
                    <Text style={{ fontSize: 30, fontFamily: "Hiragino" }}>Ready to Rollo?</Text>
                    <PhoneInput ref={(ref) => { this.phone = ref }} style={{
                        paddingTop: 20, paddingBottom: 20, borderBottomWidth: 3,
                        borderBottomColor: "black",
                    }} textStyle={{ fontSize: 25 }} textProps={{ onFocus: () => this.props.extendPanel() }} />
                    <TouchableOpacity style={{ backgroundColor: "#33aadc", width: 300, height: 40, borderRadius: 10, flexDirection: "row", justifyContent: "center", alignItems: "center", alignContent: "center", top: 20 }} onPress={this.verifyNumber}>
                        <Text style={{ fontSize: 20, fontFamily: "Hiragino", alignSelf: "center" }}>Verify</Text>
                    </TouchableOpacity>
                </Animated.View>
                <Animated.View style={{ opacity: this.state.verificationAuthOpacity, position: "absolute", top: 20, zIndex: this.state.codeAuthZPosition }}>
                    <Text style={{ fontSize: 30, fontFamily: "Hiragino" }}>Enter the verification code</Text>
                    <CodeInput
                        codeLength={6}
                        ref={c => this.codeInput = c}
                        keyboardType="numeric"
                        activeColor="#33aadc"
                        inactiveColor="#33aadc"
                        autoFocus={false}
                        ignoreCase={true}
                        inputPosition='center'
                        size={50}
                        onFulfill={(isValid) => this.verifyCode(isValid)}
                        containerStyle={{ paddingTop: 20, paddingBottom: 20 }}
                        codeInputStyle={{ borderBottomWidth: 1.5 }}
                    />
                </Animated.View>
                <Animated.View style={{ opacity: this.state.userNameOpacity, position: "absolute", top: 20, zIndex: this.state.nameZPosition, justifyContent: "center" }}>
                    <Text style={{ fontSize: 30, fontFamily: "Hiragino" }}>Last thing! Let's make this place look a bit more like home.</Text>
                    <View style={{ flex: 3 / 10, alignItems: "center" }}>
                        <TouchableOpacity onPress={this.pickImage}>
                            <View>
                                <Image style={styles.avatar} source={{ uri: this.state.image || "https://pngimage.net/wp-content/uploads/2018/05/default-user-profile-image-png-2.png" }} />
                                <Image style={{ zIndex: 2, width: 40, height: 40, position: "relative", alignSelf: "flex-end", bottom: 40 }} source={require("../../../assets/add-picture.png")} />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View>
                        <Text style={{ fontFamily: "Hiragino", fontSize: 10 }}>Name</Text>
                        <TextInput
                            style={{ height: 40, borderBottomColor: "black", borderBottomWidth: 1 }}
                            placeholder="John Smith"
                            onChangeText={(text) => {
                                this.setState({ text })
                                console.log(this.state.text)
                            }}
                            multiline={false}
                            autoCorrect={false}
                            enablesReturnKeyAutomatically={true}
                        />
                    </View>
                    <TouchableOpacity style={{ backgroundColor: "#33aadc", width: 300, height: 40, borderRadius: 10, flexDirection: "row", justifyContent: "center", alignItems: "center", alignContent: "center", top: 20, alignSelf: "center" }} onPress={() => this.signUserIn(this.state.token, this.state.text, "@", this.state.phoneNumber)}>
                        <Text style={{ fontSize: 20, fontFamily: "Hiragino", alignSelf: "center" }}>Submit</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        )
    }
}